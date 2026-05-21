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

/**
 * context.contextFit is 0–1 from the text worker; pie charts use 0–100%.
 */
/** Most recent contextFit by timeline offset (not last array row — media chunks may trail). */
export function getLatestAgendaPercent(timeline: MeetingTimelineEntry[]): number | null {
  let bestOffset = -1;
  let bestFit: number | null = null;

  for (const entry of timeline) {
    const payload = asFusedPayload(entry.payload);
    const fit = payload?.context?.contextFit;
    if (typeof fit !== 'number' || !Number.isFinite(fit)) {
      continue;
    }
    const offset = entry.offsetMs || payload?.offsetMs || 0;
    if (offset >= bestOffset) {
      bestOffset = offset;
      bestFit = fit;
    }
  }

  if (bestFit === null) {
    return null;
  }
  return Math.round(Math.min(1, Math.max(0, bestFit)) * 100);
}

export function computeAverageAgendaPercent(timeline: MeetingTimelineEntry[]): number {
  const scores: number[] = [];
  for (const entry of timeline) {
    const fit = asFusedPayload(entry.payload)?.context?.contextFit;
    if (typeof fit === 'number' && Number.isFinite(fit)) {
      scores.push(Math.min(1, Math.max(0, fit)));
    }
  }
  if (scores.length === 0) {
    return 0;
  }
  const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
  return Math.round(avg * 100);
}

export function extractAgendaTimelinePoints(
  timeline: MeetingTimelineEntry[],
): Array<{ offset: number; fit: number }> {
  const points: Array<{ offset: number; fit: number }> = [];
  for (const entry of timeline) {
    const payload = asFusedPayload(entry.payload);
    const fit = payload?.context?.contextFit;
    if (typeof fit !== 'number' || !Number.isFinite(fit)) {
      continue;
    }
    points.push({
      offset: entry.offsetMs || payload?.offsetMs || 0,
      fit: Math.min(100, Math.max(0, fit * 100)),
    });
  }
  return points.sort((a, b) => a.offset - b.offset);
}
