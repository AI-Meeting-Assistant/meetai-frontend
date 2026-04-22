import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { LiveMetricPanel } from '../components/dashboard/LiveMetricPanel';
import { MeetingControls } from '../components/dashboard/MeetingControls';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useMediaStream } from '../hooks/useMediaStream';
import { useSSE } from '../hooks/useSSE';
import { updateStatus } from '../services/meeting.service';

export function LiveDashboardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { setActiveMeeting, setStreamTicket, resetMeetingState, liveAlerts, streamTicket } = useMeeting();
  const media = useMediaStream();
  const { connected } = useSSE(id ?? null, token);

  useEffect(() => {
    setActiveMeeting(id ?? null);
    return () => {
      media.stop();
      resetMeetingState();
    };
  }, [id]);

  const handleStart = async () => {
    if (!id) {
      return;
    }
    const result = await updateStatus(id, 'IN_PROGRESS');
    const ticket = result.streamTicket ?? null;
    const expiresAt = result.ticketExpiresAt ?? null;
    setStreamTicket(ticket, expiresAt);
    if (ticket) {
      await media.start(id, ticket);
    }
  };

  const handleEnd = async () => {
    if (!id) {
      return;
    }
    await updateStatus(id, 'COMPLETED');
    media.stop();
    setStreamTicket(null, null);
    navigate(`/meetings/${id}/analysis`);
  };

  return (
    <main>
      <h1>Live Dashboard</h1>
      <p>SSE: {connected ? 'connected' : 'disconnected'}</p>
      <p>Ticket: {streamTicket ?? 'none'}</p>
      {media.streamError && <p>{media.streamError}</p>}
      <MeetingControls onStart={handleStart} onEnd={handleEnd} isCapturing={media.isCapturing} />
      <LiveMetricPanel label="Focus" />
      <LiveMetricPanel label="Emotion" />
      <LiveMetricPanel label="Audio" />
      <AlertFeed alerts={liveAlerts} />
    </main>
  );
}
