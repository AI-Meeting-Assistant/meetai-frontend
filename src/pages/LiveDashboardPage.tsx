import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { LiveTranscriptPanel } from '../components/dashboard/LiveTranscriptPanel';
import { AppLogo, UserMenu } from '../components/common/AppHeader';
import { SunIcon, MoonIcon } from '../components/common/Icons';
import { EditMeetingModal } from '../components/meetings/EditMeetingModal';
import { SpeakerTimeChart } from '../components/analysis/SpeakerTimeChart';
import { ParticipantStatsPanel } from '../components/analysis/ParticipantStatsPanel';
import { SpeakingRateLevelChart } from '../components/analysis/SpeakingRateLevelChart';
import { FocusLevelChart } from '../components/analysis/FocusLevelChart';
import { AgendaAdherenceLevelChart } from '../components/analysis/AgendaAdherenceLevelChart';
import { TimelineViewer } from '../components/analysis/TimelineViewer';
import * as meetingService from '../services/meeting.service';
import { useAuth } from '../contexts/AuthContext';
import { useMeeting } from '../contexts/MeetingContext';
import { useTheme } from '../contexts/ThemeContext';
import { colors, focusColor, metricColors } from '../components/common/colors';
import { useMeetingDetails } from '../hooks/useMeetingDetails';
import { getLatestAgendaPercent } from '../utils/timelineMetrics';
import type { FusedDataPayload } from '../types';

// ── MetricRing for the sidebar ────────────────────────────────────────────────

function MetricRing({ value, color, size = 90, sw = 6, label }: {
  value: number; color: string; size?: number; sw?: number; label: string;
}) {
  const r = (size - sw * 2) / 2;
  const cir = 2 * Math.PI * r;
  const off = cir * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={cir} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: size / 5.8, fontWeight: 600, color: 'var(--tx-1)' }}>
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 500, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LiveDashboardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    setActiveMeeting, setLiveMeetingTitle, resetMeetingState,
    liveAlerts, liveTranscriptBlocks, liveSseConnected, streamTicket,
    media, endMeeting, isEnding, uploadCount,
    setPendingSummaryMeetingId, latestAgendaFitPercent, registerAgendaTimelineRefresh,
  } = useMeeting();

  const { meeting, analysis, fetchTimeline, refresh } = useMeetingDetails(id ?? null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  // Resizable sidebar
  const [sidebarW, setSidebarW] = useState(316);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(316);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (meeting?.startedAt) {
      const base = Date.now() - new Date(meeting.startedAt).getTime();
      setElapsed(Math.round(base / 1000));
    }
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [meeting?.startedAt]);

  // Drag handle
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = dragStartX.current - e.clientX;
      setSidebarW(Math.max(220, Math.min(520, dragStartW.current + delta)));
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  useEffect(() => {
    setActiveMeeting(id ?? null);
    return () => { setActiveMeeting(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    registerAgendaTimelineRefresh(fetchTimeline);
    return () => registerAgendaTimelineRefresh(null);
  }, [fetchTimeline, registerAgendaTimelineRefresh]);

  useEffect(() => {
    if (uploadCount > 0) fetchTimeline();
  }, [uploadCount, fetchTimeline]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => { void fetchTimeline(); }, 30_000);
    return () => clearInterval(interval);
  }, [id, fetchTimeline]);

  useEffect(() => {
    if (meeting?.title) setLiveMeetingTitle(meeting.title);
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
            meetingId: id, streamTicket, transcript,
            title: meeting.title ?? '', agenda: meeting.agenda ?? '',
          });
        } catch { /* Python unavailable */ }
      }
      navigate(`/meetings/${id}/analysis`);
    } catch { setIsSummarizing(false); }
  };

  const timeline = analysis?.timeline ?? [];
  const latestEntry = timeline[timeline.length - 1];
  let latestFocusRate = 0;
  let latestSpeakingRate = 0;
  if (latestEntry) {
    const p = latestEntry.payload as Partial<FusedDataPayload> | null;
    if (typeof p?.video?.focusScore === 'number') latestFocusRate = p.video.focusScore * 100;
    if (typeof p?.audio?.vadSpeechRatioPercent === 'number') latestSpeakingRate = p.audio.vadSpeechRatioPercent;
  }

  const agendaPiePercent = useMemo(
    () => getLatestAgendaPercent(timeline) ?? latestAgendaFitPercent ?? 0,
    [timeline, latestAgendaFitPercent],
  );

  const userName = user?.fullName ?? user?.email ?? 'User';
  const userRole = user?.role === 'MODERATOR' ? 'Moderator' : 'Viewer';

  // Summarising overlay
  if (isSummarizing) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
        gap: 16, zIndex: 100,
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--border)', borderTopColor: colors.accent,
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--tx-3)' }}>Ending meeting, generating summary…</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Custom TopBar ──────────────────────────────────────────────────── */}
      <div style={{
        height: 'var(--topbar-h)', background: 'transparent', borderBottom: 'none',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        flexShrink: 0, zIndex: 50,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      }}>
        <AppLogo onClick={() => { resetMeetingState(); navigate('/meetings'); }} />
        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

        {/* LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: colors.red,
            display: 'block', animation: 'pulse 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.red, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Live
          </span>
        </div>

        {/* Meeting title */}
        <span style={{
          fontSize: 14, fontWeight: 600, color: 'var(--tx-1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260,
        }}>
          {meeting?.title ?? 'Live Dashboard'}
        </span>

        {/* Connection status pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Connected',  active: liveSseConnected },
            { label: 'Streaming', active: !!streamTicket },
          ].map(({ label, active }) => active && (
            <span key={label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 500,
              color: colors.green, background: colors.greenBg,
              padding: '2px 8px', borderRadius: 'var(--r-sm)', whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.green, display: 'block' }} />
              {label}
            </span>
          ))}
        </div>

        {media.streamError && (
          <span style={{ fontSize: 12, color: colors.red }}>{media.streamError}</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Elapsed timer */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
          color: 'var(--tx-2)', padding: '4px 12px',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)', flexShrink: 0,
        }}>
          {fmtSec(elapsed)}
        </div>

        {/* Edit (moderator) */}
        {user?.role === 'MODERATOR' && (
          <button type="button" className="btn-secondary" style={{ fontSize: 12 }}
            onClick={() => setShowEditModal(true)}>
            Edit
          </button>
        )}

        {/* End Meeting */}
        <button type="button" className="btn-danger" style={{ fontSize: 12 }}
          onClick={() => void handleEnd()} disabled={isEnding}>
          {isEnding ? 'Ending…' : 'End Meeting'}
        </button>

        {/* Theme toggle */}
        <button
          className="profile-icon-btn"
          onClick={toggleDarkMode}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          style={{ marginLeft: 4 }}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>

        <UserMenu userName={userName} userRole={userRole}
          onLogout={() => { resetMeetingState(); navigate('/login'); }} />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `1fr 4px ${sidebarW}px`,
        overflow: 'hidden',
      }}>

        {/* LEFT — main content, scrollable */}
        <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Agenda strip */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '10px 16px',
            fontSize: 12, color: 'var(--tx-3)', flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--tx-2)', marginRight: 8 }}>Agenda</span>
            {meeting?.agenda || 'No agenda set.'}
          </div>

          {/* Live transcript */}
          <LiveTranscriptPanel blocks={liveTranscriptBlocks} />

          {/* Speaker time */}
          <SpeakerTimeChart timeline={timeline} />

          {/* Participant overview */}
          <ParticipantStatsPanel timeline={timeline} />

          {/* Line charts */}
          <SpeakingRateLevelChart timeline={timeline} />
          <FocusLevelChart timeline={timeline} />
          <AgendaAdherenceLevelChart timeline={timeline} />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={e => {
            dragging.current = true;
            dragStartX.current = e.clientX;
            dragStartW.current = sidebarW;
            e.preventDefault();
          }}
          style={{ width: 4, cursor: 'col-resize', background: 'transparent', transition: 'background 0.15s', zIndex: 10 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-border)')}
          onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = 'transparent'; }}
        />

        {/* RIGHT — sidebar */}
        <div style={{
          background: 'var(--bg-subtle)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>

          {/* Live Metrics */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Live Metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <MetricRing value={latestSpeakingRate} color={metricColors.speaking} label="Speaking Rate" />
              <MetricRing value={latestFocusRate}    color={focusColor(latestFocusRate)} label="Focus Level" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <MetricRing value={agendaPiePercent} color={metricColors.agenda} label="Agenda Adherence" />
            </div>
          </div>

          {/* Alerts */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <AlertFeed alerts={liveAlerts} />
          </div>

          {/* Timeline */}
          <div style={{ padding: 16, flex: 1 }}>
            <TimelineViewer entries={timeline} />
          </div>
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
    </div>
  );
}
