import { useMemo } from 'react';
import type { MeetingTimelineEntry, FusedDataPayload } from '../../types';
import { LineChartCard } from './LineChartCard';
import { computeAverageFocusPercent } from '../../utils/timelineMetrics';

function focusColor(pct: number) {
  if (pct >= 75) return 'var(--green)';
  if (pct >= 50) return 'var(--amber)';
  return 'var(--red)';
}

export function FocusLevelChart({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const data = useMemo(() => (
    timeline
      .map(entry => {
        const p = entry.payload as Partial<FusedDataPayload>;
        // focusScore is 0–1 from backend — multiply to get 0–100
        const raw = p?.video?.focusScore ?? 0;
        return { x: entry.offsetMs || p?.offsetMs || 0, y: Math.min(100, Math.max(0, raw * 100)) };
      })
      .sort((a, b) => a.x - b.x)
  ), [timeline]);

  const avg = useMemo(() => computeAverageFocusPercent(timeline), [timeline]);

  return (
    <LineChartCard
      title="Focus Level"
      data={data}
      color={focusColor(avg)}
      avg={avg > 0 ? avg : null}
      emptyLabel="No focus data yet."
    />
  );
}
