import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { ExportButton } from '../components/analysis/ExportButton';
import { MeetingMetricsSection } from '../components/analysis/MeetingMetricsSection';
import { RecordedMetricsSection } from '../components/analysis/RecordedMetricsSection';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import { LiveTranscriptPanel } from '../components/dashboard/LiveTranscriptPanel';
import { buildTranscriptBlocksFromTimeline } from '../utils/liveTranscript';
import {
  computeAverageAgendaPercent,
  computeAverageFocusPercent,
  computeAverageSpeakingRatePercent,
} from '../utils/timelineMetrics';
import { resolveMeetingSummary } from '../utils/meetingSummary';
import {
  getRecordedAgendaPercent,
  getRecordedSpeakingPercent,
} from '../utils/recordedMetrics';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDeleteMeetingModal } from '../components/meetings/ConfirmDeleteMeetingModal';
import { EditMeetingModal } from '../components/meetings/EditMeetingModal';
import { StatusBadge } from '../components/meetings/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useMeetingDetails } from '../hooks/useMeetingDetails';
import { useRecordedProcessingEvents } from '../hooks/useRecordedProcessingEvents';
import * as meetingService from '../services/meeting.service';
import type { RecordedAnalysisPayload } from '../types';

export function MeetingAnalysisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const {
    startMeeting,
    endMeeting,
    isStarting,
    isEnding,
    startError,
    pendingSummaryMeetingId,
    receivedSummary,
    setPendingSummaryMeetingId,
  } = useMeeting();

  const { analysis, meeting, isLoading, refresh, refreshSilent } = useMeetingDetails(id ?? null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summaryTimedOut, setSummaryTimedOut] = useState(false);

  const isSummaryPending = pendingSummaryMeetingId === id;

  useEffect(() => {
    if (!isSummaryPending) return;
    const timer = setTimeout(() => {
      setPendingSummaryMeetingId(null);
      setSummaryTimedOut(true);
    }, 100_000);
    return () => clearTimeout(timer);
  }, [isSummaryPending, setPendingSummaryMeetingId]);

  const meetingsForSse = useMemo(
    () => (meeting ? [meeting] : []),
    [meeting],
  );
  useRecordedProcessingEvents(meetingsForSse, token, refreshSilent);

  const isRecorded = meeting?.meetingType === 'RECORDED';
  const isProcessingRecorded = isRecorded && meeting?.status === 'IN_PROGRESS';

  const recordedPayload = useMemo(() => {
    const entry = analysis?.timeline?.find((t) => t.offsetMs === 0);
    return (entry?.payload ?? null) as RecordedAnalysisPayload | null;
  }, [analysis?.timeline]);

  const recordedSpeakers = recordedPayload?.recorded?.speakers ?? [];

  const liveTranscriptBlocks = useMemo(() => {
    if (isRecorded) return [];
    return buildTranscriptBlocksFromTimeline(analysis?.timeline ?? []);
  }, [isRecorded, analysis?.timeline]);

  const liveTimeline = analysis?.timeline ?? [];
  const averageFocusPercent = useMemo(
    () => computeAverageFocusPercent(liveTimeline),
    [liveTimeline],
  );
  const averageSpeakingRatePercent = useMemo(
    () => computeAverageSpeakingRatePercent(liveTimeline),
    [liveTimeline],
  );
  const averageAgendaPercent = useMemo(
    () => computeAverageAgendaPercent(liveTimeline),
    [liveTimeline],
  );

  const recordedSpeakingPercent = useMemo(
    () => getRecordedSpeakingPercent(recordedPayload),
    [recordedPayload],
  );
  const recordedAgendaPercent = useMemo(
    () => getRecordedAgendaPercent(recordedPayload),
    [recordedPayload],
  );

  const resolvedSummary = useMemo(
    () => resolveMeetingSummary(analysis, recordedPayload, receivedSummary),
    [analysis, recordedPayload, receivedSummary],
  );

  const handleStartMeeting = async () => {
    if (!id) return;
    try {
      await startMeeting(id);
      navigate(`/meetings/${id}/live`);
    } catch {
      // Error handled by context
    }
  };

  const handleEndMeeting = async () => {
    if (!id) return;
    try {
      await endMeeting(id);
      await refresh();
    } catch {
      // Error handled by context
    }
  };

  const handleSaveMeeting = async (title: string, agenda: string) => {
    if (!id) return;
    await meetingService.updateMeeting(id, { title, agenda });
    await refresh();
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
      {isModerator && !isRecorded && (
        <>
          <button type="button" className="btn-secondary" onClick={() => setShowEditModal(true)}>
            Edit Meeting
          </button>
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
            <button
              type="button"
              className="btn-danger"
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Meeting'}
            </button>
          )}
          {status !== 'IN_PROGRESS' && (
            <button type="button" className="btn-danger" onClick={() => setShowDeleteModal(true)}>
              Delete Meeting
            </button>
          )}
        </>
      )}
      {isModerator && isRecorded && status !== 'IN_PROGRESS' && (
        <>
          <button type="button" className="btn-secondary" onClick={() => setShowEditModal(true)}>
            Edit Meeting
          </button>
          <button type="button" className="btn-danger" onClick={() => setShowDeleteModal(true)}>
            Delete Meeting
          </button>
        </>
      )}
      <ExportButton meetingTitle={meeting?.title} />
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

      {isRecorded ? (
        <RecordedMetricsSection
          agenda={meeting?.agenda ?? ''}
          summary={resolvedSummary}
          summaryPending={isSummaryPending}
          summaryTimedOut={summaryTimedOut}
          transcriptLines={recordedPayload?.recorded?.transcriptLines ?? []}
          fullTranscript={recordedPayload?.audio?.transcript}
          recordedSpeakers={recordedSpeakers}
          speakingPiePercent={recordedSpeakingPercent}
          agendaPiePercent={recordedAgendaPercent}
          isProcessing={isProcessingRecorded}
        />
      ) : (
        <MeetingMetricsSection
          timeline={liveTimeline}
          agenda={meeting?.agenda ?? ''}
          summary={resolvedSummary}
          summaryPending={isSummaryPending}
          summaryTimedOut={summaryTimedOut}
          transcriptPanel={<LiveTranscriptPanel blocks={liveTranscriptBlocks} />}
          focusPiePercent={averageFocusPercent}
          speakingPiePercent={averageSpeakingRatePercent}
          agendaPiePercent={averageAgendaPercent}
        />
      )}

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {!isRecorded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <AlertsLog alerts={analysis.alerts} />
          </div>
        )}
        {!isRecorded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <TimelineViewer entries={analysis.timeline} />
          </div>
        )}
      </div>

      {showEditModal && meeting && (
        <EditMeetingModal
          initialTitle={meeting.title}
          initialAgenda={meeting.agenda ?? ''}
          onSave={handleSaveMeeting}
          onClose={() => setShowEditModal(false)}
        />
      )}

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
