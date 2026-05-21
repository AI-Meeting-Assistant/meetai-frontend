import { useMemo } from 'react';
import type { MeetingTimelineEntry, FusedDataPayload } from '../../types';
import { LineChartCard } from './LineChartCard';
import { computeAverageFocusPercent } from '../../utils/timelineMetrics';
import { metricColors } from '../common/colors';

export function FocusLevelChart({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const data = useMemo(() => (
    timeline
      .map(entry => {
        const p = entry.payload as Partial<FusedDataPayload>;
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
      color={metricColors.focus}
      avg={avg > 0 ? avg : null}
      emptyLabel="No focus data yet."
    />
  );
}
