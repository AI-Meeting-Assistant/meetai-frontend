import type { FusedDataPayload, MeetingTimelineEntry } from '../types';

function asFusedPayload(payload: unknown): Partial<FusedDataPayload> | null {
  if (payload === null || typeof payload !== 'object') {
    return null;
  }
  return payload as Partial<FusedDataPayload>;
}

/**
 * Arithmetic mean of video.focusScore across timeline chunks (0–1 scale → 0–100%).
 * Skips entries without a numeric focusScore.
 */
export function computeAverageFocusPercent(timeline: MeetingTimelineEntry[]): number {
  const scores: number[] = [];
  for (const entry of timeline) {
    const focusScore = asFusedPayload(entry.payload)?.video?.focusScore;
    if (typeof focusScore === 'number' && Number.isFinite(focusScore)) {
      scores.push(focusScore);
    }
  }
  if (scores.length === 0) {
    return 0;
  }
  const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
  return Math.round(avg * 100);
}

/**
 * Arithmetic mean of audio.vadSpeechRatioPercent across timeline chunks (0–100%).
 * Skips entries without a numeric ratio.
 */
export function computeAverageSpeakingRatePercent(timeline: MeetingTimelineEntry[]): number {
  const ratios: number[] = [];
  for (const entry of timeline) {
    const ratio = asFusedPayload(entry.payload)?.audio?.vadSpeechRatioPercent;
    if (typeof ratio === 'number' && Number.isFinite(ratio)) {
      ratios.push(Math.min(100, Math.max(0, ratio)));
    }
  }
  if (ratios.length === 0) {
    return 0;
  }
  const avg = ratios.reduce((sum, v) => sum + v, 0) / ratios.length;
  return Math.round(avg);
}
