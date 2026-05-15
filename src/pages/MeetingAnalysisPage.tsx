import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgendaPanel } from '../components/analysis/AgendaPanel'
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { ExportButton } from '../components/analysis/ExportButton';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDeleteMeetingModal } from '../components/meetings/ConfirmDeleteMeetingModal';
import { StatusBadge } from '../components/meetings/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useMeetingDetails } from '../hooks/useMeetingDetails';
import * as meetingService from '../services/meeting.service';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteMeeting = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await meetingService.deleteMeeting(id);
      navigate('/meetings');
    } catch {
      setIsDeleting(false);
    }
  };

  if (isLoading || !analysis) {
    return <div className="loading">Loading analysis…</div>;
  }

  const isModerator = user?.role === 'MODERATOR';
  const status = meeting?.status;
  const timelineResolutionLabel =
    typeof meeting?.timelineResolutionMs === 'number'
      ? `Resolution: ${meeting.timelineResolutionMs} ms`
      : 'Resolution: not set';

  const statusLabel = status ? (
    <>
      <StatusBadge status={status} />
      <span className="status-label">{timelineResolutionLabel}</span>
    </>
  ) : (
    <span className="status-label">{timelineResolutionLabel}</span>
  );

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
          {status !== 'IN_PROGRESS' && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Meeting
            </button>
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
        statusLabel={statusLabel}
        actions={headerActions}
        error={startError}
      />

      <div className="analysis-full">
        {meeting?.agenda && <AgendaPanel agenda={meeting.agenda} />}
        <AiSummaryPanel summary={analysis.aiSummary} />
      </div>

      <div className="analysis-grid">
        <AlertsLog alerts={analysis.alerts} />
        <TimelineViewer entries={analysis.timeline} />
      </div>

      {showDeleteModal && (
        <ConfirmDeleteMeetingModal
          meetingTitle={meeting?.title ?? 'this meeting'}
          onConfirm={handleDeleteMeeting}
          onClose={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}
    </main>
  );
}
