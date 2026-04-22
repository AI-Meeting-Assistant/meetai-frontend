export function LiveMetricPanel({ label }: { label: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h4>{label}</h4>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
        Live data coming in Phase 3.
      </p>
    </section>
  );
}
