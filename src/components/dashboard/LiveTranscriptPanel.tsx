import type { LiveTranscriptBlock } from '../../types';

interface LiveTranscriptPanelProps {
  blocks: LiveTranscriptBlock[];
}

function formatOffsetLabel(offsetMs: number): string {
  if (offsetMs >= 1000) {
    return `${(offsetMs / 1000).toFixed(1)}s`;
  }
  return `${offsetMs}ms`;
}

export function LiveTranscriptPanel({ blocks }: LiveTranscriptPanelProps) {
  return (
    <section className="panel live-transcript-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
        <h4>Live transcript</h4>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {blocks.length} segment{blocks.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="live-transcript-scroll scroll-container"
        style={{
          maxHeight: 'min(40vh, 360px)',
          overflowY: 'auto',
          padding: '0.5rem 0',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.45,
        }}
      >
        {blocks.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Transcript appears here when fused audio and video data arrive over the live stream.
          </p>
        ) : (
          blocks.map((block) => (
            <div key={block.offsetMs} style={{ marginBottom: '0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                {formatOffsetLabel(block.offsetMs)}
              </div>
              {block.lines.map((line, idx) => (
                <p key={`${block.offsetMs}-${idx}-${line.speaker}`} style={{ margin: '0.2rem 0' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{line.speaker}:</strong>{' '}
                  {line.text}
                </p>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
