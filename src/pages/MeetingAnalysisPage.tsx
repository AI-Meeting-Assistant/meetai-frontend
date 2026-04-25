import { useNavigate, useParams } from 'react-router-dom';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { ExportButton } from '../components/analysis/ExportButton';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/meetings/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useMeetingDetails } from '../hooks/useMeetingDetails';

export function MeetingAnalysisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    startMeeting, 
    endMeeting, 
    isStarting, 
    isEnding, 
    startError 
  } = useMeeting();

  const { analysis, meeting, isLoading, refresh } = useMeetingDetails(id ?? null);

  const handleStartMeeting = async () => {
    if (!id) return;
    try {
      await startMeeting(id);
      navigate(`/meetings/${id}/live`);
    } catch (error) {
      // Error handled by context state
    }
  };

  const handleEndMeeting = async () => {
    if (!id) return;
    try {
      await endMeeting(id);
      await refresh();
    } catch (error) {
      // Error handled by console or context potentially
    }
  };

  if (isLoading || !analysis) {
    return <div className="loading">Loading analysis…</div>;
  }

  const isModerator = user?.role === 'MODERATOR';
  const status = meeting?.status;

  const headerActions = (
    <>
      {isModerator && (
        <>
          {status === 'SCHEDULED' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleStartMeeting}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Meeting'}
            </button>
          )}
          {status === 'IN_PROGRESS' && (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={handleEndMeeting}
                disabled={isEnding}
              >
                {isEnding ? 'Ending...' : 'End Meeting'}
              </button>
            </>
          )}
        </>
      )}
      <ExportButton />
    </>
  );

  return (
    <main className="page">
      <PageHeader
        onBack={() => navigate('/meetings')}
        backLabel="Back to Meetings"
        title={meeting?.title || 'Meeting Analysis'}
        statusLabel={status ? <StatusBadge status={status} /> : null}
        actions={headerActions}
        error={startError}
      />

      <div className="analysis-full">
        <AiSummaryPanel summary={analysis.aiSummary} />
      </div>

      <div className="analysis-grid">
        <AlertsLog alerts={analysis.alerts} />
        <TimelineViewer entries={analysis.timeline} />
      </div>
    </main>
  );
}

