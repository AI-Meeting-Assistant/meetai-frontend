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

function ProcessingPlaceholder({ label }: { label: string }) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', minHeight: 220,
    }}>
      <div style={{
        width: 28, height: 28, marginBottom: 12,
        border: '2.5px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ margin: 0, fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic' }}>{label}</p>
    </div>
  );
}

export function RecordedMetricsSection({
  agenda, summary, summaryPending, summaryTimedOut,
  transcriptLines, fullTranscript, recordedSpeakers,
  speakingPiePercent, agendaPiePercent, isProcessing = false,
}: RecordedMetricsSectionProps) {
  return (
    <>
      {/* Content stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <AgendaPanel agenda={agenda} />
        <AiSummaryPanel summary={summary} isPending={summaryPending || isProcessing} timedOut={summaryTimedOut} />
        <TranscriptPanel
          lines={isProcessing ? [] : transcriptLines}
          fullTranscript={isProcessing ? undefined : fullTranscript}
        />
      </div>

      {/* 2×2 metrics grid */}
      <div className="analysis-metrics-recorded" style={{ marginBottom: 16 }}>
        {isProcessing
          ? <ProcessingPlaceholder label="Analyzing speaking rate…" />
          : <SpeakingRatePieChart speakingRate={speakingPiePercent} />
        }
        {isProcessing
          ? <ProcessingPlaceholder label="Analyzing agenda adherence…" />
          : <AgendaAdherencePieChart adherencePercent={agendaPiePercent} />
        }
        <div className="analysis-metrics-recorded-speakers">
          {isProcessing
            ? <ProcessingPlaceholder label="Analyzing speakers…" />
            : <SpeakerTimeChart recordedSpeakers={recordedSpeakers} />
          }
        </div>
      </div>
    </>
  );
}
