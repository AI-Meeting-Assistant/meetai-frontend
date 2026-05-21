import { useEffect, useRef } from 'react';
import * as meetingService from '../services/meeting.service';
import type { Meeting } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const POLL_MS = Number(import.meta.env.VITE_RECORDED_POLL_MS) || 5000;

/**
 * Subscribes to SSE + polls for RECORDED meetings still IN_PROGRESS;
 * refreshes when processing completes (SSE may be missed if no subscriber was connected).
 */
export function useRecordedProcessingEvents(
  meetings: Meeting[],
  token: string | null,
  onRefresh: () => void,
): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const processingIds = meetings
    .filter((m) => m.meetingType === 'RECORDED' && m.status === 'IN_PROGRESS')
    .map((m) => m.id)
    .join(',');

  useEffect(() => {
    const processing = meetings.filter(
      (m) => m.meetingType === 'RECORDED' && m.status === 'IN_PROGRESS',
    );
    if (!token || processing.length === 0) return;

    let refreshScheduled = false;
    const triggerRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      void Promise.resolve(onRefreshRef.current()).finally(() => {
        refreshScheduled = false;
      });
    };

    const sources: EventSource[] = [];

    for (const meeting of processing) {
      const es = new EventSource(
        `${API_BASE_URL}/meetings/${meeting.id}/events?token=${encodeURIComponent(token)}`,
      );
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as { type?: string };
          if (parsed.type === 'MEETING_COMPLETED' || parsed.type === 'MEETING_FAILED') {
            triggerRefresh();
          }
        } catch {
          // ignore malformed
        }
      };
      sources.push(es);
    }

    const poll = setInterval(() => {
      void (async () => {
        for (const meeting of processing) {
          try {
            const data = await meetingService.getMeetingAnalysis(meeting.id);
            if (data.meeting.status !== 'IN_PROGRESS') {
              triggerRefresh();
              return;
            }
          } catch {
            // ignore transient errors
          }
        }
      })();
    }, POLL_MS);

    return () => {
      clearInterval(poll);
      for (const es of sources) {
        es.close();
      }
    };
  }, [processingIds, token, meetings]);
}
