import { useEffect, useState } from 'react';
import { connectAlertsStream, disconnectAlertsStream, onAlert } from '../services/sse.service';
import { useMeeting } from '../contexts/MeetingContext';
import type { MeetingAlert } from '../types';

interface UseSSEResult {
  connected: boolean;
}

export function useSSE(meetingId: string | null, token: string | null): UseSSEResult {
  const [connected, setConnected] = useState(false);
  const { pushAlert } = useMeeting();

  useEffect(() => {
    if (!meetingId || !token) {
      disconnectAlertsStream();
      setConnected(false);
      return;
    }

    const source = connectAlertsStream(meetingId, token);
    setConnected(true);

    onAlert((raw) => {
      const parsed = JSON.parse(raw) as MeetingAlert;
      pushAlert(parsed);
    });

    source.onerror = () => setConnected(false);

    return () => {
      disconnectAlertsStream();
      setConnected(false);
    };
  }, [meetingId, token, pushAlert]);

  return { connected };
}
