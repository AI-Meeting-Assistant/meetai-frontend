import type { LiveTranscriptLine, TranscriptLine } from '../types';

/**
 * Extract transcript lines from a fused payload.
 *
 * Prefers the pre-parsed ``transcriptLines`` array when available (new schema).
 * Falls back to parsing the flat ``audio.transcript`` string
 * ("Speaker 1: text\nSpeaker 2: ...") for backwards-compat.
 */
export function extractTranscriptLines(
  transcriptLines: TranscriptLine[] | null | undefined,
  transcript: string | null | undefined,
): LiveTranscriptLine[] {
  // Prefer structured transcriptLines from the new payload shape
  if (Array.isArray(transcriptLines) && transcriptLines.length > 0) {
    return transcriptLines.map((tl) => ({
      speaker: tl.speaker || '—',
      text: tl.text || '',
    }));
  }

  // Fallback: parse the flat transcript string
  return parseFusedTranscriptText(transcript);
}

/** Parse fused ``audio.transcript`` ("Speaker 1: text\nSpeaker 2: ...") into lines. */
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
