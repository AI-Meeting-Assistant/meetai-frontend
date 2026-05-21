import type { ReactNode } from 'react';
import type { MeetingTimelineEntry } from '../../types';
import { metricColors } from '../common/colors';
import { AgendaPanel } from './AgendaPanel';
import { AiSummaryPanel } from './AiSummaryPanel';
import { AgendaAdherenceLevelChart } from './AgendaAdherenceLevelChart';
import { FocusLevelChart } from './FocusLevelChart';
import { SpeakingRateLevelChart } from './SpeakingRateLevelChart';
import { SpeakerTimeChart } from './SpeakerTimeChart';
import { ParticipantStatsPanel } from './ParticipantStatsPanel';

interface MeetingMetricsSectionProps {
  timeline: MeetingTimelineEntry[];
  agenda: string;
  summary: string | null | undefined;
  summaryPending?: boolean;
  summaryTimedOut?: boolean;
  transcriptPanel: ReactNode;
  focusPiePercent: number;
  speakingPiePercent: number;
  agendaPiePercent: number;
}

// ── Shared MetricRing for the KPI row ─────────────────────────────────────────

function MetricRing({ value, color, size = 96, sw = 7 }: { value: number; color: string; size?: number; sw?: number }) {
  const r = (size - sw * 2) / 2;
  const cir = 2 * Math.PI * r;
  const off = cir * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={cir} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: size / 5.8, fontWeight: 600, color: 'var(--tx-1)' }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <MetricRing value={Math.round(value)} color={color} size={112} sw={8} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.5 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export function MeetingMetricsSection({
  timeline, agenda, summary, summaryPending, summaryTimedOut,
  transcriptPanel, focusPiePercent, speakingPiePercent, agendaPiePercent,
}: MeetingMetricsSectionProps) {
  return (
    <>
      {/* KPI row — static colors (no semantic judgment on completed data) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Avg. Focus"        value={focusPiePercent}    color={metricColors.focus}    sub="Across all participants" />
        <KpiCard label="Speaking Activity" value={speakingPiePercent} color={metricColors.speaking} sub="Active speaking fraction" />
        <KpiCard label="Agenda Adherence"  value={agendaPiePercent}   color={metricColors.agenda}   sub="On-topic score" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AgendaPanel agenda={agenda} />
          <AiSummaryPanel summary={summary} isPending={summaryPending} timedOut={summaryTimedOut} />
          {transcriptPanel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ParticipantStatsPanel timeline={timeline} />
          <SpeakerTimeChart timeline={timeline} />
        </div>
      </div>

      {/* Full-width line charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SpeakingRateLevelChart timeline={timeline} />
        <FocusLevelChart timeline={timeline} />
        <AgendaAdherenceLevelChart timeline={timeline} />
      </div>
    </>
  );
}
