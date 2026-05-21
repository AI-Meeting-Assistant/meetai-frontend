import { useMemo } from 'react';
import type { MeetingTimelineEntry, FusedDataPayload } from '../../types';
import { LineChartCard } from './LineChartCard';
import { computeAverageSpeakingRatePercent } from '../../utils/timelineMetrics';
import { metricColors } from '../common/colors';

export function SpeakingRateLevelChart({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const data = useMemo(() => (
    timeline
      .map(entry => {
        const p = entry.payload as Partial<FusedDataPayload>;
        const y = p?.audio?.vadSpeechRatioPercent;
        return { x: entry.offsetMs || p?.offsetMs || 0, y: typeof y === 'number' ? Math.min(100, Math.max(0, y)) : 0 };
      })
      .sort((a, b) => a.x - b.x)
  ), [timeline]);

  const avg = useMemo(() => computeAverageSpeakingRatePercent(timeline), [timeline]);

  return (
    <LineChartCard
      title="Speaking Activity"
      data={data}
      color={metricColors.speaking}
      avg={avg > 0 ? avg : null}
      emptyLabel="No speech data yet."
    />
  );
}
