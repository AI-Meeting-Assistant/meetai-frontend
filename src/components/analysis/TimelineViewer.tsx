import { useState } from 'react';
import type { MeetingTimelineEntry } from '../../types';

function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function TimelineEntry({ entry, index }: { entry: MeetingTimelineEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '11px 0', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-3)', width: 40, flexShrink: 0 }}>
          {formatMs(entry.offsetMs)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-1)', flex: 1 }}>
          Chunk {index + 1}
        </span>
        <span style={{
          color: 'var(--tx-3)', flexShrink: 0,
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s', display: 'flex',
        }}>
          <ChevronRight />
        </span>
      </div>

      {expanded && (
        <div style={{ paddingBottom: 12, paddingLeft: 54 }}>
          <pre style={{
            margin: 0, fontSize: 11, color: 'var(--tx-2)',
            background: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)',
            padding: '10px 12px', overflowX: 'auto',
            border: '1px solid var(--border-subtle)',
          }}>
            {JSON.stringify(entry, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function TimelineViewer({ entries }: { entries: MeetingTimelineEntry[] }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>Timeline</span>
        <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          {entries.length} chunks
        </span>
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic', margin: '8px 0 0' }}>
          No timeline data.
        </p>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {entries.map((entry, i) => (
            <TimelineEntry key={`${entry.offsetMs}-${i}`} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
