import type { ReactNode } from 'react';
import type { MeetingTimelineEntry } from '../../types';
import { AgendaPanel } from './AgendaPanel';
import { AiSummaryPanel } from './AiSummaryPanel';
import { AgendaAdherenceLevelChart } from './AgendaAdherenceLevelChart';
import { AgendaAdherencePieChart } from './AgendaAdherencePieChart';
import { FocusLevelChart } from './FocusLevelChart';
import { FocusPieChart } from './FocusPieChart';
import { SpeakerTimeChart } from './SpeakerTimeChart';
import { SpeakingRateLevelChart } from './SpeakingRateLevelChart';
import { SpeakingRatePieChart } from './SpeakingRatePieChart';

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

export function MeetingMetricsSection({
  timeline,
  agenda,
  summary,
  summaryPending,
  summaryTimedOut,
  transcriptPanel,
  focusPiePercent,
  speakingPiePercent,
  agendaPiePercent,
}: MeetingMetricsSectionProps) {
  return (
    <>
      <div className="analysis-top">
        <AgendaPanel agenda={agenda} />
        <AiSummaryPanel
          summary={summary}
          isPending={summaryPending}
          timedOut={summaryTimedOut}
        />
        {transcriptPanel}
      </div>

      <div className="analysis-metrics-2x2">
        <SpeakingRatePieChart speakingRate={speakingPiePercent} />
        <FocusPieChart focusRate={focusPiePercent} />
        <SpeakerTimeChart timeline={timeline} />
        <AgendaAdherencePieChart adherencePercent={agendaPiePercent} />
      </div>

      <div className="analysis-lines-stack">
        <SpeakingRateLevelChart timeline={timeline} />
        <FocusLevelChart timeline={timeline} />
        <AgendaAdherenceLevelChart timeline={timeline} />
      </div>
    </>
  );
}
