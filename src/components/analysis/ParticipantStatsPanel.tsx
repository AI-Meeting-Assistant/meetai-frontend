import { useMemo } from 'react';
import type { MeetingTimelineEntry } from '../../types';

interface ParticipantStat {
  personId: number;
  label: string;
  talkMs: number;
  talkPercent: number;
  avgFocusPercent: number | null;
}

function buildParticipantStats(timeline: MeetingTimelineEntry[]): ParticipantStat[] {
  const map = new Map<number, { talkMs: number; focusSum: number; focusCount: number }>();

  for (const entry of timeline) {
    const payload = entry.payload as Record<string, unknown> | null;
    if (!payload) continue;

    const speakerMapping = (payload['speakerMapping'] ?? null) as Record<string, number> | null;
    const speakerTalkMs = ((payload['audio'] as Record<string, unknown> | null)?.['speakerTalkMs'] ?? null) as Record<string, number> | null;
    const persons = ((payload['video'] as Record<string, unknown> | null)?.['persons'] ?? []) as Array<{ personId: number; focusScore: number }>;

    if (speakerMapping && speakerTalkMs) {
      for (const [speaker, personId] of Object.entries(speakerMapping)) {
        const ms = speakerTalkMs[speaker] ?? 0;
        const existing = map.get(personId) ?? { talkMs: 0, focusSum: 0, focusCount: 0 };
        map.set(personId, { ...existing, talkMs: existing.talkMs + ms });
      }
    }

    for (const person of persons) {
      if (typeof person.focusScore === 'number' && typeof person.personId === 'number') {
        const existing = map.get(person.personId) ?? { talkMs: 0, focusSum: 0, focusCount: 0 };
        map.set(person.personId, {
          ...existing,
          focusSum: existing.focusSum + person.focusScore,
          focusCount: existing.focusCount + 1,
        });
      }
    }
  }

  const totalTalkMs = Array.from(map.values()).reduce((s, v) => s + v.talkMs, 0);

  return Array.from(map.entries())
    .map(([personId, { talkMs, focusSum, focusCount }]) => ({
      personId,
      label: `Participant ${personId + 1}`,
      talkMs,
      talkPercent: totalTalkMs > 0 ? (talkMs / totalTalkMs) * 100 : 0,
      avgFocusPercent: focusCount > 0 ? (focusSum / focusCount) * 100 : null,
    }))
    .filter(p => p.talkMs > 0 || p.avgFocusPercent !== null)
    .sort((a, b) => b.talkMs - a.talkMs);
}

function focusColor(percent: number): string {
  if (percent >= 70) return 'var(--color-success)';
  if (percent >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${(s / 60).toFixed(1)} min`;
}

function StatColumn({
  label,
  percent,
  barColor,
  valueLabel,
}: {
  label: string;
  percent: number;
  barColor: string;
  valueLabel: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: barColor }}>{valueLabel}</span>
      </div>
      <div style={{ height: 8, backgroundColor: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(percent, 100)}%`,
          height: '100%',
          backgroundColor: barColor,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

export function ParticipantStatsPanel({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const participants = useMemo(() => buildParticipantStats(timeline), [timeline]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h3>Participant Overview</h3>
      </div>

      {participants.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          No participant data yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {participants.map(p => (
            <div key={p.personId}>
              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>{p.label}</div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <StatColumn
                  label={`Talk — ${formatTime(p.talkMs)}`}
                  percent={p.talkPercent}
                  barColor="var(--color-primary)"
                  valueLabel={`${p.talkPercent.toFixed(1)}%`}
                />
                <StatColumn
                  label="Focus"
                  percent={p.avgFocusPercent ?? 0}
                  barColor={p.avgFocusPercent !== null ? focusColor(p.avgFocusPercent) : 'var(--color-border)'}
                  valueLabel={p.avgFocusPercent !== null ? `${p.avgFocusPercent.toFixed(0)}%` : '–'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
