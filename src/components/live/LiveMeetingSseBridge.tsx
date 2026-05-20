import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeeting } from '../../contexts/MeetingContext';
import { useSSE } from '../../hooks/useSSE';
import { clearDesktopNotifications } from '../../services/desktopNotifications';

/**
 * Keeps SSE + OS notifications alive while a meeting is streaming,
 * even if the user navigates away from the live dashboard or minimizes the app.
 */
export function LiveMeetingSseBridge() {
  const { token } = useAuth();
  const { activeMeetingId, streamTicket, pendingSummaryMeetingId } = useMeeting();

  // Keep SSE alive after navigation by falling back to pendingSummaryMeetingId
  // so SUMMARY_READY can arrive even after LiveDashboardPage unmounts
  const effectiveMeetingId = activeMeetingId ?? pendingSummaryMeetingId;
  const sseMeetingId = streamTicket && effectiveMeetingId ? effectiveMeetingId : null;
  useSSE(sseMeetingId, token);

  useEffect(() => {
    if (!streamTicket) {
      void clearDesktopNotifications();
    }
  }, [streamTicket]);

  return null;
}
