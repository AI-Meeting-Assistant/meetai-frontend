import { useMemo } from 'react';
import type { MeetingTimelineEntry } from '../../types';
import { LineChartCard } from './LineChartCard';
import { computeAverageAgendaPercent, extractAgendaTimelinePoints } from '../../utils/timelineMetrics';
import { metricColors } from '../common/colors';

export function AgendaAdherenceLevelChart({ timeline }: { timeline: MeetingTimelineEntry[] }) {
  const data = useMemo(() => (
    extractAgendaTimelinePoints(timeline).map(d => ({ x: d.offset, y: d.fit }))
  ), [timeline]);

  const avg = useMemo(() => computeAverageAgendaPercent(timeline), [timeline]);

  return (
    <LineChartCard
      title="Agenda Adherence"
      data={data}
      color={metricColors.agenda}
      avg={avg > 0 ? avg : null}
      emptyLabel="No agenda adherence data yet."
      yTicks={[20, 40, 65, 90]}
    />
  );
}
