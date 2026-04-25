import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { LiveMetricPanel } from '../components/dashboard/LiveMetricPanel';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useSSE } from '../hooks/useSSE';
import { useMeetingDetails } from '../hooks/useMeetingDetails';

export function LiveDashboardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { 
    setActiveMeeting, 
    resetMeetingState, 
    liveAlerts, 
    streamTicket,
    media,
    endMeeting,
    isEnding
  } = useMeeting();
  
  const { connected } = useSSE(id ?? null, token);
  const { meeting } = useMeetingDetails(id ?? null);

  useEffect(() => {
    setActiveMeeting(id ?? null);
    return () => {
      resetMeetingState();
    };
  }, [id, setActiveMeeting, resetMeetingState]);

  const handleEnd = async () => {
    if (!id) return;
    try {
      await endMeeting(id);
      navigate(`/meetings/${id}/analysis`);
    } catch (error) {
      // Handled in context
    }
  };

  const statusLabel = (
    <>
      <span className="status-label">
        <span className={`status-dot ${connected ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
        {connected ? 'Connected' : 'Disconnected'}
      </span>
      {streamTicket && (
        <span className="status-label">
          <span className="status-dot status-dot-connected" />
          Streaming
        </span>
      )}
    </>
  );

  return (
    <main className="page">
      <PageHeader
        onBack={() => navigate('/meetings')}
        backLabel="Back to Meetings"
        title={meeting ? `${meeting.title} - Live Dashboard` : 'Live Dashboard'}
        statusLabel={statusLabel}
        actions={(
          <button 
            type="button" 
            className="btn-danger" 
            onClick={handleEnd} 
            disabled={isEnding}
          >
            {isEnding ? 'Ending...' : 'End Meeting'}
          </button>
        )}
        error={media.streamError}
      />

      <div className="dashboard-grid">
        <LiveMetricPanel label="Focus" />
        <LiveMetricPanel label="Emotion" />
        <LiveMetricPanel label="Audio" />
      </div>

      <AlertFeed alerts={liveAlerts} />
    </main>
  );
}
