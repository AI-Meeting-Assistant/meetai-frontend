import type { RecordedAnalysisPayload } from '../types';

/**
 * Full-meeting adherence score from recorded.adherence.score or payload.context (0–1 → 0–100).
 */
export function getRecordedAgendaPercent(payload: RecordedAnalysisPayload | null): number {
  if (!payload) {
    return 0;
  }

  const score =
    payload.recorded?.adherence?.score ??
    payload.context?.contextFit ??
    null;

  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 0;
  }
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}

/** VAD speech ratio from batch audio analysis (0–100). */
export function getRecordedSpeakingPercent(payload: RecordedAnalysisPayload | null): number {
  const ratio = payload?.audio?.vadSpeechRatioPercent;
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) {
    return 0;
  }
  return Math.round(Math.min(100, Math.max(0, ratio)));
}
