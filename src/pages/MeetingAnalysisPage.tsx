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

// ── Scheduled view ─────────────────────────────────────────────────────────────

function ScheduledView({
  meeting, isModerator, isStarting, startError, onStart,
}: {
  meeting: { title: string; agenda: string | null; status: string; createdAt?: string; timelineResolutionMs?: number };
  isModerator: boolean;
  isStarting: boolean;
  startError?: string | null;
  onStart: () => void;
}) {
  const resolutionLabel = typeof meeting.timelineResolutionMs === 'number'
    ? `${meeting.timelineResolutionMs} ms`
    : 'not set';

  const dateLabel = meeting.createdAt
    ? new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      {/* Hero CTA */}
      <div style={{
        textAlign: 'center', padding: '52px 40px', marginBottom: 24,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--tx-1)', margin: '0 0 8px' }}>
          Ready to start
        </h2>
        <p style={{ fontSize: 13, color: 'var(--tx-3)', margin: '0 0 28px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          When you start the session, MeetAI begins capturing focus and speaking data in real time.
          All processing runs locally on your device.
        </p>
        {startError && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 16px' }}>{startError}</p>
        )}
        {isModerator && (
          <button
            type="button"
            className="btn-primary"
            onClick={onStart}
            disabled={isStarting}
            style={{ padding: '10px 28px', fontSize: 14 }}
          >
            {isStarting ? 'Starting…' : 'Start Meeting'}
          </button>
        )}
      </div>

      {/* Agenda + details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: '22px 26px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 12 }}>Agenda</div>
          <p style={{ fontSize: 13, color: 'var(--tx-2)', margin: 0, lineHeight: 1.7 }}>
            {meeting.agenda || 'No agenda set.'}
          </p>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Details
          </div>
          {[
            { label: 'Date',       value: dateLabel ?? '—' },
            { label: 'Type',       value: 'Live' },
            { label: 'Resolution', value: resolutionLabel },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-1)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tx-3)" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 6 }}>
          Insights available after session
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx-3)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
          Focus scores, speaking analysis, AI summary, and timeline data will appear here once the meeting is complete.
        </div>
      </div>

    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MeetingAnalysisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const {
    startMeeting, endMeeting, isStarting, isEnding,
    startError, pendingSummaryMeetingId, receivedSummary,
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

  const meetingsForSse = useMemo(() => (meeting ? [meeting] : []), [meeting]);
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
  const averageFocusPercent    = useMemo(() => computeAverageFocusPercent(liveTimeline),        [liveTimeline]);
  const averageSpeakingRatePercent = useMemo(() => computeAverageSpeakingRatePercent(liveTimeline), [liveTimeline]);
  const averageAgendaPercent   = useMemo(() => computeAverageAgendaPercent(liveTimeline),        [liveTimeline]);

  const recordedSpeakingPercent = useMemo(() => getRecordedSpeakingPercent(recordedPayload), [recordedPayload]);
  const recordedAgendaPercent   = useMemo(() => getRecordedAgendaPercent(recordedPayload),   [recordedPayload]);

  const resolvedSummary = useMemo(
    () => resolveMeetingSummary(analysis, recordedPayload, receivedSummary),
    [analysis, recordedPayload, receivedSummary],
  );

  const handleStartMeeting = async () => {
    if (!id) return;
    try { await startMeeting(id); navigate(`/meetings/${id}/live`); } catch { /* handled by context */ }
  };
  const handleEndMeeting = async () => {
    if (!id) return;
    try { await endMeeting(id); await refresh(); } catch { /* handled by context */ }
  };
  const handleSaveMeeting = async (title: string, agenda: string) => {
    if (!id) return;
    await meetingService.updateMeeting(id, { title, agenda });
    await refresh();
  };
  const handleDeleteMeeting = async () => {
    if (!id) return;
    setIsDeleting(true);
    try { await meetingService.deleteMeeting(id); navigate('/meetings'); }
    catch { setIsDeleting(false); }
  };

  if (isLoading || !analysis) {
    return <div className="loading">Loading analysis…</div>;
  }

  const isModerator = user?.role === 'MODERATOR';
  const status = meeting?.status;

  // Resolution label as a small chip
  const resolutionChip = typeof meeting?.timelineResolutionMs === 'number' ? (
    <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
      {isRecorded ? 'Recorded · ' : ''}Resolution {meeting.timelineResolutionMs} ms
    </span>
  ) : null;

  const statusLabel = status ? <StatusBadge status={status} /> : null;

  // Header actions — scheduled meetings get Edit+Delete in header just like the design
  const scheduledActions = isModerator ? (
    <>
      {resolutionChip}
      <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEditModal(true)}>Edit</button>
      <button type="button" className="btn-danger"    style={{ fontSize: 13 }} onClick={() => setShowDeleteModal(true)}>Delete</button>
    </>
  ) : resolutionChip;

  const headerActions = (
    <>
      {resolutionChip}
      {isModerator && !isRecorded && (
        <>
          <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEditModal(true)}>Edit</button>
          {status === 'IN_PROGRESS' && (
            <button type="button" className="btn-danger" style={{ fontSize: 13 }} onClick={() => void handleEndMeeting()} disabled={isEnding}>
              {isEnding ? 'Ending…' : 'End Meeting'}
            </button>
          )}
          {status === 'COMPLETED' && (
            <button type="button" className="btn-danger" style={{ fontSize: 13 }} onClick={() => setShowDeleteModal(true)}>Delete</button>
          )}
        </>
      )}
      {isModerator && isRecorded && status !== 'IN_PROGRESS' && (
        <>
          <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowEditModal(true)}>Edit</button>
          <button type="button" className="btn-danger"    style={{ fontSize: 13 }} onClick={() => setShowDeleteModal(true)}>Delete</button>
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
        actions={status === 'SCHEDULED' ? scheduledActions : headerActions}
        error={startError}
      />

      {/* Scheduled view */}
      {status === 'SCHEDULED' && !isRecorded && meeting && (
        <ScheduledView
          meeting={meeting}
          isModerator={isModerator}
          isStarting={isStarting}
          startError={startError}
          onStart={() => void handleStartMeeting()}
        />
      )}

      {/* Recorded meeting */}
      {isRecorded && (
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
      )}

      {/* Completed / in-progress live meeting */}
      {!isRecorded && status !== 'SCHEDULED' && (
        <>
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

          {/* Alerts + Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, marginTop: 16 }}>
            <AlertsLog alerts={analysis.alerts} />
            <TimelineViewer entries={analysis.timeline} />
          </div>
        </>
      )}

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
