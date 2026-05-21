import { useEffect, useState } from 'react';
import { connectAlertsStream, disconnectAlertsStream, onMessage } from '../services/sse.service';
import { showDesktopNotificationForAlert } from '../services/desktopNotifications';
import { useMeeting } from '../contexts/MeetingContext';
import type { SseEventType, LiveAlert, FusedDataPayload } from '../types';

interface UseSSEResult {
  connected: boolean;
}

export function useSSE(meetingId: string | null, token: string | null): UseSSEResult {
  const [connected, setConnected] = useState(false);
  const {
    pushLiveAlert,
    pushFusedData,
    setLiveSseConnected,
    liveMeetingTitle,
    setStreamTicket,
    setPendingSummaryMeetingId,
    setReceivedSummary,
  } = useMeeting();

  useEffect(() => {
    if (!meetingId || !token) {
      disconnectAlertsStream();
      setConnected(false);
      setLiveSseConnected(false);
      return;
    }

    const source = connectAlertsStream(meetingId, token);

    onMessage((raw) => {
      let parsed: { type: SseEventType } & Record<string, unknown>;
      try {
        parsed = JSON.parse(raw) as { type: SseEventType } & Record<string, unknown>;
      } catch {
        return;
      }

      switch (parsed.type) {
        case 'CONNECTED':
          setConnected(true);
          break;

        case 'FUSED_DATA':
          pushFusedData(parsed as unknown as FusedDataPayload);
          break;

        case 'FOCUS_DROP':
        case 'FOCUS_RECOVERED':
        case 'SPEAKING_RATE_DROP':
        case 'SPEAKING_RATE_RECOVERED':
        case 'AGENDA_DEVIATION': {
          const alert = {
            type: parsed.type,
            offsetMs: parsed['offsetMs'] as number,
            avg: parsed['avg'] as number | undefined,
            contextFit: parsed['contextFit'] as number | undefined,
          } satisfies LiveAlert;
          pushLiveAlert(alert);
          void showDesktopNotificationForAlert(alert, liveMeetingTitle ?? undefined);
          break;
        }

        case 'AGENDA_FIT': {
          const alert = {
            type: parsed.type,
            offsetMs: parsed['offsetMs'] as number,
            contextFit: parsed['contextFit'] as number | undefined,
          } satisfies LiveAlert;
          pushLiveAlert(alert);
          void showDesktopNotificationForAlert(alert, liveMeetingTitle ?? undefined);
          break;
        }

        case 'SUMMARY_READY': {
          const aiSummary = parsed['aiSummary'] as string;
          setReceivedSummary(aiSummary);
          setPendingSummaryMeetingId(null);
          setStreamTicket(null, null);
          break;
        }

        case 'MEETING_COMPLETED':
        case 'MEETING_FAILED':
          break;
      }
    });

    source.onerror = () => setConnected(false);

    return () => {
      disconnectAlertsStream();
      setConnected(false);
      setLiveSseConnected(false);
    };
  }, [meetingId, token, pushLiveAlert, pushFusedData, liveMeetingTitle, setLiveSseConnected, setStreamTicket, setPendingSummaryMeetingId, setReceivedSummary]);

  useEffect(() => {
    setLiveSseConnected(connected);
  }, [connected, setLiveSseConnected]);

  return { connected };
}
