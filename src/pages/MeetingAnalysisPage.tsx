import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgendaPanel } from '../components/analysis/AgendaPanel';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { AlertsLog } from '../components/analysis/AlertsLog';
import { AudioDurationCard } from '../components/analysis/AudioDurationCard';
import { ExportButton } from '../components/analysis/ExportButton';
import { FocusPieChart } from '../components/analysis/FocusPieChart';
import { FocusLevelChart } from '../components/analysis/FocusLevelChart';
import { SilenceRatioDonut } from '../components/analysis/SilenceRatioDonut';
import { SpeakerTimeChart } from '../components/analysis/SpeakerTimeChart';
import { SpeakingRatePieChart } from '../components/analysis/SpeakingRatePieChart';
import { SpeakingRateLevelChart } from '../components/analysis/SpeakingRateLevelChart';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import { TranscriptPanel } from '../components/analysis/TranscriptPanel';
import { LiveTranscriptPanel } from '../components/dashboard/LiveTranscriptPanel';
import { buildTranscriptBlocksFromTimeline } from '../utils/liveTranscript';
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
  } = useMeeting();

  const { analysis, meeting, isLoading, refresh } = useMeetingDetails(id ?? null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const meetingsForSse = useMemo(
    () => (meeting ? [meeting] : []),
    [meeting],
  );
  useRecordedProcessingEvents(meetingsForSse, token, refresh);

  const isRecorded = meeting?.meetingType === 'RECORDED';
  const isProcessingRecorded = isRecorded && meeting?.status === 'IN_PROGRESS';

  const recordedPayload = useMemo(() => {
    const entry = analysis?.timeline?.find((t) => t.offsetMs === 0);
    return (entry?.payload ?? null) as RecordedAnalysisPayload | null;
  }, [analysis?.timeline]);

  const liveTranscriptBlocks = useMemo(() => {
    if (isRecorded) return [];
    return buildTranscriptBlocksFromTimeline(analysis?.timeline ?? []);
  }, [isRecorded, analysis?.timeline]);

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

  if (isProcessingRecorded) {
    return (
      <main className="page">
        <PageHeader
          onBack={() => navigate('/meetings')}
          backLabel="Back to Meetings"
          title={meeting?.title || 'Meeting Analysis'}
          statusLabel={<StatusBadge status="IN_PROGRESS" />}
        />
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div
            style={{
              width: 40,
              height: 40,
              margin: '0 auto var(--space-4)',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <h3 style={{ marginTop: 0 }}>İşleniyor…</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Uploaded recording is being analyzed. This page will update automatically when complete.
          </p>
        </div>
      </main>
    );
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
      <ExportButton />
    </>
  );

  const durationMs = recordedPayload?.recorded?.durationMs ?? 0;
  const speechMs = recordedPayload?.audio?.vadSpeechMs ?? 0;
  const silenceMs = recordedPayload?.audio?.vadSilenceMs ?? 0;
  const speechRatio = recordedPayload?.audio?.vadSpeechRatioPercent ?? 0;

  // Latest speaking rate (LIVE) from last timeline entry, mirrors FocusPieChart pattern
  const liveTimeline = analysis.timeline ?? [];
  const lastLiveEntry = liveTimeline[liveTimeline.length - 1];
  let latestSpeakingRate = 0;
  if (lastLiveEntry) {
    const payload = lastLiveEntry.payload as any;
    if (typeof payload?.audio?.vadSpeechRatioPercent === 'number') {
      latestSpeakingRate = payload.audio.vadSpeechRatioPercent;
    }
  }

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
        <AgendaPanel agenda={meeting?.agenda ?? ''} />
        <AiSummaryPanel summary={analysis.aiSummary} />
        {!isRecorded && <FocusLevelChart timeline={analysis.timeline ?? []} />}
        {!isRecorded && <SpeakingRateLevelChart timeline={analysis.timeline ?? []} />}
      </div>

      {isRecorded ? (
        <div className="analysis-grid">
          <AudioDurationCard durationMs={durationMs} />
          <SilenceRatioDonut
            speechRatioPercent={speechRatio}
            speechMs={speechMs}
            silenceMs={silenceMs}
          />
          <SpeakerTimeChart timeline={analysis.timeline ?? []} />
        </div>
      ) : (
        <div className="analysis-grid">
          <FocusPieChart focusRate={analysis.focusRate ?? 0} />
          <SpeakingRatePieChart speakingRate={latestSpeakingRate} />
          <SpeakerTimeChart timeline={analysis.timeline ?? []} />
        </div>
      )}

      {isRecorded && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <TranscriptPanel
            lines={recordedPayload?.recorded?.transcriptLines ?? []}
            fullTranscript={recordedPayload?.audio?.transcript}
          />
        </div>
      )}

      {!isRecorded && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <LiveTranscriptPanel blocks={liveTranscriptBlocks} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {!isRecorded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <AlertsLog alerts={analysis.alerts} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <TimelineViewer entries={analysis.timeline} />
        </div>
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
