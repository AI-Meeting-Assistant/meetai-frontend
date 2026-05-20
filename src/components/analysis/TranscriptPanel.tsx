import type { RecordedTranscriptLine } from '../../types';

interface TranscriptPanelProps {
  lines: RecordedTranscriptLine[];
  fullTranscript?: string | null;
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TranscriptPanel({ lines, fullTranscript }: TranscriptPanelProps) {
  const hasLines = lines.length > 0;

  return (
    <div className="panel scroll-container" style={{ display: 'flex', flexDirection: 'column', maxHeight: 420 }}>
      <div className="panel-header">
        <h3>Transcript</h3>
      </div>
      <div
        className="scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          paddingRight: 'var(--space-2)',
        }}
      >
        {hasLines ? (
          lines.map((line, index) => (
            <div key={`${line.startMs}-${index}`}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                {line.speaker} · {formatTimestamp(line.startMs)}–{formatTimestamp(line.endMs)}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{line.text}</p>
            </div>
          ))
        ) : fullTranscript ? (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{fullTranscript}</p>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No transcript available.</p>
        )}
      </div>
    </div>
  );
}
