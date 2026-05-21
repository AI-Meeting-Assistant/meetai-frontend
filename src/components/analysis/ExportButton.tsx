import { useState } from 'react';
import type {
  MeetingTimelineEntry,
  MeetingAlert,
  FusedDataPayload,
  RecordedTranscriptLine,
  RecordedSpeaker,
} from '../../types';
import {
  computeAverageFocusPercent,
  computeAverageSpeakingRatePercent,
  computeAverageAgendaPercent,
  extractAgendaTimelinePoints,
} from '../../utils/timelineMetrics';
import { buildTranscriptBlocksFromTimeline } from '../../utils/liveTranscript';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportButtonProps {
  meetingTitle?: string;
  meetingDate?: string | null;
  meetingType?: 'LIVE' | 'RECORDED';
  darkMode?: boolean;
  agenda?: string | null;
  aiSummary?: string | null;
  timeline?: MeetingTimelineEntry[];
  alerts?: MeetingAlert[];
  meetingStartedAt?: string | null;
  // Recorded-specific
  transcriptLines?: RecordedTranscriptLine[];
  fullTranscript?: string | null;
  recordedSpeakers?: RecordedSpeaker[];
  // Pre-computed percents (from parent)
  focusPercent?: number;
  speakingPercent?: number;
  agendaPercent?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildFocusTimeline(timeline: MeetingTimelineEntry[]): Array<{ x: number; y: number }> {
  return timeline
    .map(entry => {
      const p = entry.payload as Partial<FusedDataPayload>;
      const raw = p?.video?.focusScore ?? 0;
      return { x: entry.offsetMs || p?.offsetMs || 0, y: Math.min(100, Math.max(0, raw * 100)) };
    })
    .sort((a, b) => a.x - b.x);
}

function buildSpeakingTimeline(timeline: MeetingTimelineEntry[]): Array<{ x: number; y: number }> {
  return timeline
    .map(entry => {
      const p = entry.payload as Partial<FusedDataPayload>;
      const y = p?.audio?.vadSpeechRatioPercent;
      return { x: entry.offsetMs || p?.offsetMs || 0, y: typeof y === 'number' ? Math.min(100, Math.max(0, y)) : 0 };
    })
    .sort((a, b) => a.x - b.x);
}

function buildAgendaTimeline(timeline: MeetingTimelineEntry[]): Array<{ x: number; y: number }> {
  return extractAgendaTimelinePoints(timeline).map(d => ({ x: d.offset, y: d.fit }));
}

type SpeakerEntry = { label: string; ms: number; percent: number };

function buildSpeakers(timeline: MeetingTimelineEntry[], recordedSpeakers?: RecordedSpeaker[]): SpeakerEntry[] {
  const times: Record<string, number> = {};
  let total = 0;

  if (recordedSpeakers && recordedSpeakers.length > 0) {
    for (const sp of recordedSpeakers) {
      if (typeof sp.talkMs === 'number' && sp.talkMs > 0) {
        times[sp.label] = (times[sp.label] || 0) + sp.talkMs;
        total += sp.talkMs;
      }
    }
  } else {
    for (const entry of timeline) {
      const payload = entry.payload as Record<string, unknown> | null;
      if (!payload) continue;
      const audio = payload['audio'] as Record<string, unknown> | null;
      const speakerTalkMs = audio?.['speakerTalkMs'] as Record<string, number> | null;
      if (speakerTalkMs && typeof speakerTalkMs === 'object') {
        for (const [speaker, ms] of Object.entries(speakerTalkMs)) {
          if (typeof ms === 'number' && ms > 0) {
            times[speaker] = (times[speaker] || 0) + ms;
            total += ms;
          }
        }
      }
    }
  }

  return Object.entries(times)
    .sort((a, b) => b[1] - a[1])
    .map(([label, ms]) => ({ label, ms, percent: total > 0 ? (ms / total) * 100 : 0 }));
}

function buildParticipants(timeline: MeetingTimelineEntry[]): ExportButtonProps['timeline'] extends undefined ? never : Array<{
  label: string; talkPercent: number; talkMs: number; avgFocusPercent: number | null;
}> {
  const map = new Map<number, { talkMs: number; focusSum: number; focusCount: number }>();

  for (const entry of timeline) {
    const payload = entry.payload as Record<string, unknown> | null;
    if (!payload) continue;
    const speakerMapping = (payload['speakerMapping'] ?? null) as Record<string, number> | null;
    const audio = payload['audio'] as Record<string, unknown> | null;
    const speakerTalkMs = (audio?.['speakerTalkMs'] ?? null) as Record<string, number> | null;
    const persons = ((payload['video'] as Record<string, unknown> | null)?.['persons'] ?? []) as Array<{ personId: number; focusScore: number }>;

    if (speakerMapping && speakerTalkMs) {
      for (const [speaker, personId] of Object.entries(speakerMapping)) {
        const ms = speakerTalkMs[speaker] ?? 0;
        const e = map.get(personId) ?? { talkMs: 0, focusSum: 0, focusCount: 0 };
        map.set(personId, { ...e, talkMs: e.talkMs + ms });
      }
    }
    for (const person of persons) {
      if (typeof person.focusScore === 'number' && typeof person.personId === 'number') {
        const e = map.get(person.personId) ?? { talkMs: 0, focusSum: 0, focusCount: 0 };
        map.set(person.personId, { ...e, focusSum: e.focusSum + person.focusScore, focusCount: e.focusCount + 1 });
      }
    }
  }

  const totalTalkMs = Array.from(map.values()).reduce((s, v) => s + v.talkMs, 0);
  return Array.from(map.entries())
    .map(([personId, { talkMs, focusSum, focusCount }]) => ({
      label: `Participant ${personId + 1}`,
      talkMs,
      talkPercent: totalTalkMs > 0 ? (talkMs / totalTalkMs) * 100 : 0,
      avgFocusPercent: focusCount > 0 ? (focusSum / focusCount) * 100 : null,
    }))
    .filter(p => p.talkMs > 0 || p.avgFocusPercent !== null)
    .sort((a, b) => b.talkMs - a.talkMs) as ReturnType<typeof buildParticipants>;
}

function formatAlertOffset(createdAt: string, startedAt: string): string {
  const ms = new Date(createdAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ExportButton({
  meetingTitle, meetingDate, meetingType = 'LIVE', darkMode = false,
  agenda, aiSummary, timeline = [], alerts = [], meetingStartedAt,
  transcriptLines = [], fullTranscript, recordedSpeakers,
  focusPercent, speakingPercent, agendaPercent,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const isElectron = Boolean(window.meetai?.exportPdf);

  const handleExport = async () => {
    if (!window.meetai?.exportPdf) return;

    setIsExporting(true);
    try {
      const suggestedName = meetingTitle
        ? `${meetingTitle} - Analysis Report`
        : 'MeetAI_Report';

      const reportData = {
        meetingTitle: meetingTitle || 'Meeting Report',
        meetingDate: meetingDate || new Date().toISOString(),
        meetingType,
        theme: darkMode ? 'dark' as const : 'light' as const,
        agenda: agenda ?? null,
        aiSummary: aiSummary ?? null,
        focusPercent: focusPercent ?? computeAverageFocusPercent(timeline),
        speakingPercent: speakingPercent ?? computeAverageSpeakingRatePercent(timeline),
        agendaPercent: agendaPercent ?? computeAverageAgendaPercent(timeline),
        focusTimeline: buildFocusTimeline(timeline),
        speakingTimeline: buildSpeakingTimeline(timeline),
        agendaTimeline: buildAgendaTimeline(timeline),
        speakers: buildSpeakers(timeline, recordedSpeakers),
        participants: buildParticipants(timeline),
        transcriptLines: transcriptLines.length > 0 
          ? transcriptLines.map(l => ({
              speaker: l.speaker,
              startMs: l.startMs,
              endMs: l.endMs,
              text: l.text,
            }))
          : buildTranscriptBlocksFromTimeline(timeline).flatMap(b => b.lines.map(l => ({
              speaker: l.speaker,
              startMs: b.offsetMs,
              endMs: b.offsetMs,
              text: l.text,
            }))),
        fullTranscript: fullTranscript ?? null,
        alerts: alerts.map(a => ({
          severity: a.severity,
          eventType: a.eventType,
          message: a.message,
          time: meetingStartedAt
            ? `${formatAlertOffset(a.createdAt, meetingStartedAt)} into meeting`
            : new Date(a.createdAt).toLocaleTimeString(),
        })),
      };

      const result = await window.meetai.exportPdf({ suggestedName, reportData });

      if (!result.success && result.error && result.error !== 'cancelled') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: result.error }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF export failed';
      window.dispatchEvent(new CustomEvent('api:error', { detail: message }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={!isElectron || isExporting}
      onClick={handleExport}
      title={!isElectron ? 'PDF export is only available in the desktop app' : undefined}
    >
      {isExporting ? 'Exporting…' : 'Export PDF'}
    </button>
  );
}
