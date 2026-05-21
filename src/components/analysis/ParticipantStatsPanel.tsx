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
    const speakerTalkMs  = ((payload['audio'] as Record<string, unknown> | null)?.['speakerTalkMs'] ?? null) as Record<string, number> | null;
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
      personId,
      label: `Participant ${personId + 1}`,
      talkMs,
      talkPercent: totalTalkMs > 0 ? (talkMs / totalTalkMs) * 100 : 0,
      avgFocusPercent: focusCount > 0 ? (focusSum / focusCount) * 100 : null,
    }))
    .filter(p => p.talkMs > 0 || p.avgFocusPercent !== null)
    .sort((a, b) => b.talkMs - a.talkMs);
}

function focusColor(pct: number) {
  if (pct >= 70) return 'var(--green)';
  if (pct >= 40) return 'var(--amber)';
  return 'var(--red)';
}

function formatTalkValue(talkPercent: number, talkMs: number): string {
  const pct = Math.round(talkPercent);
  const totalSec = Math.round(talkMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const dur = m > 0 ? `${m}m ${s}s` : `${s}s`;
  return `${pct}% · ${dur}`;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(Math.max(value, 0), 100)}%`,
        height: '100%', background: color,
        borderRadius: 2, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function ParticipantRow({ p, isLast }: { p: ParticipantStat; isLast: boolean }) {
  const focusCol = p.avgFocusPercent !== null ? focusColor(p.avgFocusPercent) : 'var(--border)';
  const initial = String(p.personId + 1);

  return (
    <div style={{
      paddingBottom: 16, marginBottom: isLast ? 0 : 16,
      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
    }}>
      {/* Avatar + name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
        }}>
          {initial}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-1)' }}>{p.label}</div>
          <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>Participant</div>
        </div>
      </div>

      {/* Talk time bar */}
      <div style={{ marginBottom: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Talk time</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-2)' }}>
            {formatTalkValue(p.talkPercent, p.talkMs)}
          </span>
        </div>
        <ProgressBar value={p.talkPercent} color="var(--accent)" />
      </div>

      {/* Focus bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Focus</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: focusCol }}>
            {p.avgFocusPercent !== null ? `${Math.round(p.avgFocusPercent)}%` : '–'}
          </span>
        </div>
        <ProgressBar value={p.avgFocusPercent ?? 0} color={focusCol} />
      </div>
    </div>
  );
}

export function ParticipantStatsPanel({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const participants = useMemo(() => buildParticipantStats(timeline), [timeline]);

  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 16 }}>
        Participants
      </div>

      {participants.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-3)', fontStyle: 'italic' }}>
          No participant data yet.
        </p>
      ) : (
        <div>
          {participants.map((p, i) => (
            <ParticipantRow key={p.personId} p={p} isLast={i === participants.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
