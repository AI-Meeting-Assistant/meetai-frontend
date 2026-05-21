import { useEffect, useRef } from 'react';
import type { LiveTranscriptBlock } from '../../types';
import { colors } from '../common/colors';

interface LiveTranscriptPanelProps {
  blocks: LiveTranscriptBlock[];
  showListening?: boolean;
}

const SPEAKER_COLORS = [
  colors.accent,
  colors.green,
  colors.amber,
  colors.purple,
  colors.red,
];

function speakerColor(speaker: string): string {
  let hash = 0;
  for (let i = 0; i < speaker.length; i++) hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
}

function formatOffset(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function LiveTranscriptPanel({ blocks, showListening = true }: LiveTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new blocks arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [blocks.length]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 0, paddingBottom: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>Live Transcript</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-3)' }}>
          {blocks.length} segment{blocks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="scroll-container"
        style={{ flex: 1, overflowY: 'auto', maxHeight: 440, paddingTop: 4 }}
      >
        {blocks.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic' }}>
            Transcript will appear here as audio is captured…
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.offsetMs} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', animation: 'fadeSlideIn 0.2s ease' }}>
              {block.lines.map((line, i) => {
                const color = speakerColor(line.speaker);
                return (
                  <div key={`${block.offsetMs}-${i}`}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-3)', flexShrink: 0 }}>
                        {formatOffset(block.offsetMs)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{line.speaker}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--tx-2)', margin: '0 0 4px', lineHeight: 1.55 }}>{line.text}</p>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {showListening && blocks.length > 0 && (
          <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.green, display: 'block', animation: 'pulse 1.2s infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Listening…</span>
          </div>
        )}
      </div>
    </div>
  );
}
