import { useState } from 'react';
import type { MeetingTimelineEntry } from '../../types';

function TimelineEntry({ entry, index }: { entry: MeetingTimelineEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          minHeight: 44,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--color-text)',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>Timeline {index + 1}</span>
        <span style={{ fontSize: 12, color: '#888' }}>
          {entry.offsetMs} ms {expanded ? '▲' : '▼'}
        </span>
      </button>
      {expanded && (
        <pre style={{
          margin: 0,
          padding: '10px 12px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 12,
          overflowX: 'auto',
          background: 'var(--color-bg)',
          lineHeight: 1.5,
        }}>
          {JSON.stringify(entry, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function TimelineViewer({ entries }: { entries: MeetingTimelineEntry[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Timeline</h3>
        <span style={{ fontSize: 12, color: '#888' }}>
          {entries.length} entries
        </span>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: 14, margin: 0 }}>No timeline data.</p>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, index) => (
            <TimelineEntry key={`${entry.offsetMs}-${index}`} entry={entry} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
