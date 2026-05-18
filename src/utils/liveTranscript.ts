import type { LiveTranscriptLine } from '../types';

/** Parse fused ``audio.transcript`` ("Speaker 1: text\\nSpeaker 2: ...") into lines. */
export function parseFusedTranscriptText(transcript: string | null | undefined): LiveTranscriptLine[] {
  const raw = (transcript ?? '').trim();
  if (!raw) {
    return [];
  }

  return raw.split(/\n+/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return [];
    }
    const m = /^([^:]+):\s*(.+)$/.exec(trimmed);
    if (m) {
      return [{ speaker: m[1].trim(), text: m[2].trim() }];
    }
    return [{ speaker: '—', text: trimmed }];
  });
}
