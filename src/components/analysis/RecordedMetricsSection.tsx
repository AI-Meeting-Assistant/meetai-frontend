import type { RecordedSpeaker, RecordedTranscriptLine } from '../../types';
import { AgendaPanel } from './AgendaPanel';
import { AiSummaryPanel } from './AiSummaryPanel';
import { AgendaAdherencePieChart } from './AgendaAdherencePieChart';
import { SpeakerTimeChart } from './SpeakerTimeChart';
import { SpeakingRatePieChart } from './SpeakingRatePieChart';
import { TranscriptPanel } from './TranscriptPanel';

interface RecordedMetricsSectionProps {
  agenda: string;
  summary: string | null | undefined;
  summaryPending?: boolean;
  summaryTimedOut?: boolean;
  transcriptLines: RecordedTranscriptLine[];
  fullTranscript?: string | null;
  recordedSpeakers: RecordedSpeaker[];
  speakingPiePercent: number;
  agendaPiePercent: number;
  isProcessing?: boolean;
}

function ProcessingPiePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          marginBottom: 'var(--space-3)',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label}
    </div>
  );
}

export function RecordedMetricsSection({
  agenda,
  summary,
  summaryPending,
  summaryTimedOut,
  transcriptLines,
  fullTranscript,
  recordedSpeakers,
  speakingPiePercent,
  agendaPiePercent,
  isProcessing = false,
}: RecordedMetricsSectionProps) {
  return (
    <>
      <div className="analysis-top">
        <AgendaPanel agenda={agenda} />
        <AiSummaryPanel
          summary={summary}
          isPending={summaryPending || isProcessing}
          timedOut={summaryTimedOut}
        />
        <TranscriptPanel
          lines={isProcessing ? [] : transcriptLines}
          fullTranscript={isProcessing ? undefined : fullTranscript}
        />
      </div>

      <div className="analysis-metrics-recorded">
        {isProcessing ? (
          <ProcessingPiePlaceholder label="Analyzing speaking rate…" />
        ) : (
          <SpeakingRatePieChart speakingRate={speakingPiePercent} />
        )}
        {isProcessing ? (
          <ProcessingPiePlaceholder label="Analyzing agenda adherence…" />
        ) : (
          <AgendaAdherencePieChart adherencePercent={agendaPiePercent} />
        )}
        {isProcessing ? (
          <div className="analysis-metrics-recorded-speakers">
            <ProcessingPiePlaceholder label="Analyzing speakers…" />
          </div>
        ) : (
          <div className="analysis-metrics-recorded-speakers">
            <SpeakerTimeChart recordedSpeakers={recordedSpeakers} />
          </div>
        )}
      </div>
    </>
  );
}
