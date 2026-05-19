import { useEffect } from 'react';
import type { Meeting } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Subscribes to SSE for RECORDED meetings still IN_PROGRESS; refreshes when processing completes.
 */
export function useRecordedProcessingEvents(
  meetings: Meeting[],
  token: string | null,
  onRefresh: () => void,
): void {
  useEffect(() => {
    const processing = meetings.filter(
      (m) => m.meetingType === 'RECORDED' && m.status === 'IN_PROGRESS',
    );
    if (!token || processing.length === 0) return;

    const sources: EventSource[] = [];

    for (const meeting of processing) {
      const es = new EventSource(
        `${API_BASE_URL}/meetings/${meeting.id}/events?token=${encodeURIComponent(token)}`,
      );
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as { type?: string };
          if (parsed.type === 'MEETING_COMPLETED' || parsed.type === 'MEETING_FAILED') {
            onRefresh();
          }
        } catch {
          // ignore malformed
        }
      };
      sources.push(es);
    }

    return () => {
      for (const es of sources) {
        es.close();
      }
    };
  }, [meetings, token, onRefresh]);
}
