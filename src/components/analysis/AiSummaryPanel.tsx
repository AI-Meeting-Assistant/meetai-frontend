import ReactMarkdown from 'react-markdown';

interface AiSummaryPanelProps {
  summary: string | null | undefined;
  isPending?: boolean;
  timedOut?: boolean;
}

export function AiSummaryPanel({ summary, isPending, timedOut }: AiSummaryPanelProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>AI Summary</div>
      </div>

      {isPending ? (
        <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--tx-3)' }}>
          Generating summary…
        </p>
      ) : timedOut && !summary ? (
        <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--tx-3)' }}>
          Summary unavailable.
        </p>
      ) : !summary ? (
        <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--tx-3)' }}>
          Summary not yet generated.
        </p>
      ) : (
        <div className="ai-summary-body">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
