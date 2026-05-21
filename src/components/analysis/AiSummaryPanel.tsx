import ReactMarkdown from 'react-markdown';

interface AiSummaryPanelProps {
  summary: string | null | undefined;
  isPending?: boolean;
  timedOut?: boolean;
}

export function AiSummaryPanel({ summary, isPending, timedOut }: AiSummaryPanelProps) {
  const content = () => {
    if (isPending) {
      return (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
          Generating summary…
        </p>
      );
    }
    if (timedOut && !summary) {
      return (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
          Summary unavailable.
        </p>
      );
    }
    if (!summary) {
      return (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
          Summary not yet generated.
        </p>
      );
    }
    return (
      <div className="ai-summary-body">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    );
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>AI Summary</h3>
      </div>
      {content()}
    </section>
  );
}
