export function AiSummaryPanel({ summary }: { summary: string | null | undefined }) {
  return (
    <section>
      <h3>AI Summary</h3>
      <p>{summary ?? 'Summary not yet generated'}</p>
    </section>
  );
}
