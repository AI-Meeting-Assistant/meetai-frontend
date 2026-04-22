import type { MeetingTimelineEntry } from '../../types';

export function TimelineViewer({ entries }: { entries: MeetingTimelineEntry[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Timeline</h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {entries.length} entries
        </span>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>No timeline data.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {entries.map((entry, index) => (
            <pre key={`${entry.offsetMs}-${index}`}>{JSON.stringify(entry, null, 2)}</pre>
          ))}
        </div>
      )}
    </section>
  );
}
