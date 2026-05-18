import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useSSE } from '../hooks/useSSE';
import { useMeetingDetails } from '../hooks/useMeetingDetails';
import { AgendaPanel } from '../components/analysis/AgendaPanel';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { FocusPieChart } from '../components/analysis/FocusPieChart';
import { SpeakerTimeChart } from '../components/analysis/SpeakerTimeChart';
import { FocusLevelChart } from '../components/analysis/FocusLevelChart';
import { TimelineViewer } from '../components/analysis/TimelineViewer';

const REFRESH_INTERVAL = 5000; // 5s refresh interval

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
  const { meeting, analysis, refresh } = useMeetingDetails(id ?? null);

  useEffect(() => {
    setActiveMeeting(id ?? null);

    return () => {
      setActiveMeeting(null);
      // Removed resetMeetingState() from here to avoid React 18 Strict Mode instantly killing the meeting on mount!
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [id, refresh]);

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
        onBack={() => {
          resetMeetingState();
          navigate('/meetings');
        }}
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

      <div className="analysis-full">
        {meeting?.agenda && <AgendaPanel agenda={meeting.agenda} />}
        <AiSummaryPanel summary={analysis?.aiSummary} />
      </div>

      <div className="analysis-grid">
        <FocusPieChart focusRate={analysis?.focusRate ?? 0} />
        <SpeakerTimeChart timeline={analysis?.timeline ?? []} />
        <FocusLevelChart timeline={analysis?.timeline ?? []} />
        <AlertFeed alerts={liveAlerts} />
        <TimelineViewer entries={analysis?.timeline ?? []} />
      </div>
    </main>
  );
}
