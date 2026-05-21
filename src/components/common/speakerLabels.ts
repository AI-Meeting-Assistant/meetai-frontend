import { colors } from './colors';

const SPEAKER_COLORS = [
  colors.accent,
  colors.green,
  colors.purple,
  colors.amber,
  colors.red,
];

/**
 * Converts a diarization label to a human-readable name.
 * "SPEAKER_00" → "Speaker 1", "SPEAKER_01" → "Speaker 2", etc.
 * Falls back to the raw label for non-standard formats.
 */
export function formatSpeakerLabel(speaker: string): string {
  const match = speaker.match(/_(\d+)$/);
  if (match) return `Speaker ${parseInt(match[1], 10) + 1}`;
  return speaker;
}

/**
 * Returns a consistent color for a speaker based on their numeric index.
 * SPEAKER_00 → color[0], SPEAKER_01 → color[1], etc.
 */
export function speakerColor(speaker: string): string {
  const match = speaker.match(/(\d+)$/);
  const idx = match ? parseInt(match[1], 10) : 0;
  return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
}
