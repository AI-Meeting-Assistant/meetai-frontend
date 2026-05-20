import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { EditMeetingModal } from '../components/meetings/EditMeetingModal';
import * as meetingService from '../services/meeting.service';
import { useAuth } from '../contexts/AuthContext';
import { LiveTranscriptPanel } from '../components/dashboard/LiveTranscriptPanel';
import { PageHeader } from '../components/common/PageHeader';
import { useMeeting } from '../contexts/MeetingContext';
import { useMeetingDetails } from '../hooks/useMeetingDetails';
import { AgendaPanel } from '../components/analysis/AgendaPanel';
import { AiSummaryPanel } from '../components/analysis/AiSummaryPanel';
import { FocusPieChart } from '../components/analysis/FocusPieChart';
import { SpeakerTimeChart } from '../components/analysis/SpeakerTimeChart';
import { FocusLevelChart } from '../components/analysis/FocusLevelChart';
import { SpeakingRatePieChart } from '../components/analysis/SpeakingRatePieChart';
import { SpeakingRateLevelChart } from '../components/analysis/SpeakingRateLevelChart';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import type { FusedDataPayload } from '../types';

// removed REFRESH_INTERVAL

export function LiveDashboardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    setActiveMeeting,
    setLiveMeetingTitle,
    resetMeetingState,
    liveAlerts,
    liveTranscriptBlocks,
    liveSseConnected,
    streamTicket,
    media,
    endMeeting,
    isEnding,
    uploadCount,
    setPendingSummaryMeetingId,
  } = useMeeting();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const { meeting, analysis, fetchTimeline, refresh } = useMeetingDetails(id ?? null);

  useEffect(() => {
    setActiveMeeting(id ?? null);

    return () => {
      setActiveMeeting(null);
      // Removed resetMeetingState() from here to avoid React 18 Strict Mode instantly killing the meeting on mount!
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (uploadCount > 0) {
      fetchTimeline();
    }
  }, [uploadCount, fetchTimeline]);

  useEffect(() => {
    if (meeting?.title) {
      setLiveMeetingTitle(meeting.title);
    }
  }, [meeting?.title, setLiveMeetingTitle]);

  const handleSaveMeeting = async (title: string, agenda: string) => {
    if (!id) return;
    await meetingService.updateMeeting(id, { title, agenda });
    setLiveMeetingTitle(title);
    await refresh();
  };

  const handleEnd = async () => {
    if (!id) return;
    try {
      setIsSummarizing(true);
      const { transcript } = await endMeeting(id);

      if (transcript && streamTicket && meeting) {
        setPendingSummaryMeetingId(id);
        try {
          await meetingService.summarizeMeeting({
            meetingId: id,
            streamTicket,
            transcript,
            title: meeting.title ?? '',
            agenda: meeting.agenda ?? '',
          });
        } catch {
          // Python unavailable — summary won't arrive, timeout will show "unavailable"
        }
      }

      navigate(`/meetings/${id}/analysis`);
    } catch (error) {
      setIsSummarizing(false);
      // Handled in context
    }
  };

  const statusLabel = (
    <>
      <span className="status-label">
        <span className={`status-dot ${liveSseConnected ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
        {liveSseConnected ? 'Connected' : 'Disconnected'}
      </span>
      {streamTicket && (
        <span className="status-label">
          <span className="status-dot status-dot-connected" />
          Streaming
        </span>
      )}
    </>
  );

  // Compute latest focus rate from the timeline payload
  const timeline = analysis?.timeline ?? [];
  const latestTimelineEntry = timeline[timeline.length - 1];
  let latestFocusRate = 0;
  let latestSpeakingRate = 0;
  if (latestTimelineEntry) {
    const payload = latestTimelineEntry.payload as Partial<FusedDataPayload> | null;
    if (typeof payload?.video?.focusScore === 'number') {
      latestFocusRate = payload.video.focusScore * 100;
    }
    if (typeof payload?.audio?.vadSpeechRatioPercent === 'number') {
      latestSpeakingRate = payload.audio.vadSpeechRatioPercent;
    }
  }

  if (isSummarizing) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)',
        gap: 'var(--space-4)', zIndex: 100,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Ending meeting, generating summary…</p>
      </div>
    );
  }

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
          <>
            {user?.role === 'MODERATOR' && (
              <button type="button" className="btn-secondary" onClick={() => setShowEditModal(true)}>
                Edit Meeting
              </button>
            )}
            <button
              type="button"
              className="btn-danger"
              onClick={handleEnd}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Meeting'}
            </button>
          </>
        )}
        error={media.streamError}
      />

      <div className="analysis-full">
        <AgendaPanel agenda={meeting?.agenda ?? ''} />
        <AiSummaryPanel summary={analysis?.aiSummary} />
        <LiveTranscriptPanel blocks={liveTranscriptBlocks} />
        <FocusLevelChart timeline={timeline} />
        <SpeakingRateLevelChart timeline={timeline} />
      </div>

      <div className="analysis-grid">
        <FocusPieChart focusRate={latestFocusRate} />
        <SpeakingRatePieChart speakingRate={latestSpeakingRate} />
        <SpeakerTimeChart timeline={timeline} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AlertFeed alerts={liveAlerts} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TimelineViewer entries={timeline} />
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
    </main>
  );
}
