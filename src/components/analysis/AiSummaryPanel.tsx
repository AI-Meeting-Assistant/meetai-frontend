export function AiSummaryPanel({ summary }: { summary: string | null | undefined }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>AI Summary</h3>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontStyle: summary ? 'normal' : 'italic' }}>
        {summary ?? 'Summary not yet generated.'}
      </p>
    </section>
  );
}
