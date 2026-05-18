import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMediaStream } from '../hooks/useMediaStream';
import type { LiveAlert, FusedDataPayload, LiveTranscriptBlock } from '../types';
import * as meetingService from '../services/meeting.service';
import { clearDesktopNotifications } from '../services/desktopNotifications';
import { parseFusedTranscriptText } from '../utils/liveTranscript';

const DEFAULT_TIMELINE_RESOLUTION_MS = 2000;
const MAX_LIVE_TRANSCRIPT_BLOCKS = 300;

function getElapsedOffsetMs(startedAt: string | null | undefined, resolutionMs: number): number {
  if (!startedAt) {
    return 0;
  }

  const startedAtMs = Date.parse(startedAt);
  if (!Number.isFinite(startedAtMs)) {
    return 0;
  }

  const elapsedMs = Date.now() - startedAtMs;
  if (elapsedMs <= 0) {
    return 0;
  }

  return Math.floor(elapsedMs / resolutionMs) * resolutionMs;
}

function getTimelineNextOffsetMs(
  timeline: Array<{ offsetMs: number }>,
  resolutionMs: number,
): number {
  if (timeline.length === 0) {
    return 0;
  }

  const maxOffsetMs = Math.max(...timeline.map((entry) => entry.offsetMs));
  return maxOffsetMs + resolutionMs;
}

interface MeetingContextValue {
  activeMeetingId: string | null;
  streamTicket: string | null;
  ticketExpiresAt: string | null;
  liveAlerts: LiveAlert[];
  latestFusedData: FusedDataPayload | null;
  liveTranscriptBlocks: LiveTranscriptBlock[];
  liveSseConnected: boolean;
  liveMeetingTitle: string | null;
  setLiveSseConnected: (connected: boolean) => void;
  setLiveMeetingTitle: (title: string | null) => void;
  media: ReturnType<typeof useMediaStream>;
  isStarting: boolean;
  isEnding: boolean;
  startError: string | null;
  setActiveMeeting: (id: string | null) => void;
  setStreamTicket: (ticket: string | null, expiresAt: string | null) => void;
  pushLiveAlert: (alert: LiveAlert) => void;
  pushFusedData: (data: FusedDataPayload) => void;
  resetMeetingState: () => void;
  startMeeting: (id: string) => Promise<void>;
  endMeeting: (id: string) => Promise<void>;
  uploadCount: number;
}

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [activeMeetingId, setActiveMeetingState] = useState<string | null>(null);
  const [streamTicket, setTicket] = useState<string | null>(null);
  const [ticketExpiresAt, setTicketExpiresAt] = useState<string | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [latestFusedData, setLatestFusedData] = useState<FusedDataPayload | null>(null);
  const [liveTranscriptBlocks, setLiveTranscriptBlocks] = useState<LiveTranscriptBlock[]>([]);
  const [liveSseConnected, setLiveSseConnected] = useState(false);
  const [liveMeetingTitle, setLiveMeetingTitle] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [timelineResolutionMs, setTimelineResolutionMs] = useState<number>(DEFAULT_TIMELINE_RESOLUTION_MS);
  const [uploadCount, setUploadCount] = useState(0);
  
  const media = useMediaStream(timelineResolutionMs);

  useEffect(() => {
    let isActive = true;

    const loadMeetingResolution = async () => {
      if (!activeMeetingId) {
        setTimelineResolutionMs(DEFAULT_TIMELINE_RESOLUTION_MS);
        return;
      }

      try {
        const data = await meetingService.getMeetingAnalysis(activeMeetingId);
        if (isActive) {
          setTimelineResolutionMs(data.meeting.timelineResolutionMs ?? DEFAULT_TIMELINE_RESOLUTION_MS);
        }
      } catch (error) {
        console.warn('Failed to load meeting resolution:', error);
      }
    };

    void loadMeetingResolution();

    return () => {
      isActive = false;
    };
  }, [activeMeetingId]);

  const pushLiveAlert = useCallback((alert: LiveAlert) => {
    setLiveAlerts((current) => [...current, alert]);
  }, []);

  const pushFusedData = useCallback((data: FusedDataPayload) => {
    setLatestFusedData(data);
    const lines = parseFusedTranscriptText(data.audio?.transcript);
    if (lines.length === 0) {
      return;
    }
    const block: LiveTranscriptBlock = { offsetMs: data.offsetMs, lines };
    setLiveTranscriptBlocks((prev) => {
      const idx = prev.findIndex((b) => b.offsetMs === data.offsetMs);
      const next =
        idx >= 0
          ? prev.map((b, i) => (i === idx ? block : b))
          : [...prev, block];
      return next.length > MAX_LIVE_TRANSCRIPT_BLOCKS
        ? next.slice(-MAX_LIVE_TRANSCRIPT_BLOCKS)
        : next;
    });
  }, []);

  const setStreamTicket = useCallback((ticket: string | null, expiresAt: string | null) => {
    setTicket(ticket);
    setTicketExpiresAt(expiresAt);
  }, []);

  const setActiveMeeting = useCallback((id: string | null) => {
    setActiveMeetingState(id);
  }, []);

  const stopMedia = media.stop;
  const resetMeetingState = useCallback(() => {
    setActiveMeetingState(null);
    setTicket(null);
    setTicketExpiresAt(null);
    setLiveAlerts([]);
    setLatestFusedData(null);
    setLiveTranscriptBlocks([]);
    setLiveSseConnected(false);
    setLiveMeetingTitle(null);
    setStartError(null);
    setTimelineResolutionMs(DEFAULT_TIMELINE_RESOLUTION_MS);
    setUploadCount(0);
    stopMedia();
    void clearDesktopNotifications();
  }, [stopMedia]);

  const startMeeting = useCallback(async (id: string) => {
    setIsStarting(true);
    setStartError(null);
    try {
      // 1. Verify media capture capability first
      await media.prepare();

      // 2. Only if capture is prepared, start the meeting on the backend
      const { streamTicket, ticketExpiresAt } = await meetingService.startMeeting(id);
      const analysis = await meetingService.getMeetingAnalysis(id);
      const effectiveResolutionMs =
        analysis.meeting.timelineResolutionMs ?? timelineResolutionMs;
      const initialOffsetMs = Math.max(
        getElapsedOffsetMs(analysis.meeting.startedAt, effectiveResolutionMs),
        getTimelineNextOffsetMs(analysis.timeline, effectiveResolutionMs),
      );

      // 3. Start the actual recording/streaming
      setTimelineResolutionMs(effectiveResolutionMs);
      setTicket(streamTicket);
      setTicketExpiresAt(ticketExpiresAt);
      setLiveMeetingTitle(analysis.meeting.title ?? null);
      await media.start(id, streamTicket, {
        chunkDurationMs: effectiveResolutionMs,
        initialOffsetMs,
        title:  analysis.meeting.title,
        agenda: analysis.meeting.agenda ?? '',
        onChunkUploaded: () => {
          setUploadCount((c) => c + 1);
        }
      });
    } catch (error) {
      console.error('Failed to start meeting:', error);
      const msg = error instanceof Error ? error.message : 'Failed to start meeting.';
      setStartError(msg);
      media.stop();
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, [media, timelineResolutionMs]);

  const endMeeting = useCallback(async (id: string) => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await meetingService.endMeeting(id);
      media.stop();
      setTicket(null);
      setTicketExpiresAt(null);
      setLiveTranscriptBlocks([]);
      setLiveSseConnected(false);
      void clearDesktopNotifications();
    } catch (error) {
      console.error('Failed to end meeting:', error);
      throw error;
    } finally {
      setIsEnding(false);
    }
  }, [isEnding, media]);

  const value = useMemo(
    () => ({
      activeMeetingId,
      streamTicket,
      ticketExpiresAt,
      liveAlerts,
      latestFusedData,
      liveTranscriptBlocks,
      liveSseConnected,
      liveMeetingTitle,
      setLiveSseConnected,
      setLiveMeetingTitle,
      media,
      isStarting,
      isEnding,
      startError,
      setActiveMeeting,
      setStreamTicket,
      pushLiveAlert,
      pushFusedData,
      resetMeetingState,
      startMeeting,
      endMeeting,
      uploadCount,
    }),
    [
      activeMeetingId,
      streamTicket,
      ticketExpiresAt,
      liveAlerts,
      latestFusedData,
      liveTranscriptBlocks,
      liveSseConnected,
      liveMeetingTitle,
      media,
      isStarting,
      isEnding,
      startError,
      setActiveMeeting,
      setStreamTicket,
      pushLiveAlert,
      pushFusedData,
      resetMeetingState,
      startMeeting,
      endMeeting,
      uploadCount,
    ],
  );

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) {
    throw new Error('useMeeting must be used within MeetingProvider');
  }
  return ctx;
}
