import type { MeetingAnalysis, RecordedAnalysisPayload } from '../types';

/**
 * Resolve AI summary from API shape (meeting.aiSummary), timeline payload, or live SSE.
 */
export function resolveMeetingSummary(
  analysis: MeetingAnalysis | null,
  recordedPayload: RecordedAnalysisPayload | null,
  receivedSummary: string | null,
): string | null | undefined {
  if (receivedSummary?.trim()) {
    return receivedSummary;
  }

  const fromMeeting = analysis?.meeting?.aiSummary;
  if (fromMeeting?.trim()) {
    return fromMeeting;
  }

  const fromPayload = recordedPayload?.aiSummary;
  if (fromPayload?.trim()) {
    return fromPayload;
  }

  const legacyRoot = analysis?.aiSummary;
  if (legacyRoot?.trim()) {
    return legacyRoot;
  }

  return undefined;
}
