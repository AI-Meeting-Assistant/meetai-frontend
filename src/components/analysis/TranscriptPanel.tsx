import type { RecordedTranscriptLine } from '../../types';
import { formatSpeakerLabel, speakerColor } from '../common/speakerLabels';

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
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 16 }}>Transcript</div>
      <div
        className="scroll-container"
        style={{ flex: 1, overflowY: 'auto', maxHeight: 360, display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {hasLines ? (
          lines.map((line, i) => {
            const color = speakerColor(line.speaker);
            return (
              <div key={`${line.startMs}-${i}`} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                  }}>
                    {formatSpeakerLabel(line.speaker)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
                    {formatTimestamp(line.startMs)}–{formatTimestamp(line.endMs)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65 }}>{line.text}</p>
              </div>
            );
          })
        ) : fullTranscript ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-2)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{fullTranscript}</p>
        ) : (
          <p style={{ color: 'var(--tx-3)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>No transcript available.</p>
        )}
      </div>
    </div>
  );
}
