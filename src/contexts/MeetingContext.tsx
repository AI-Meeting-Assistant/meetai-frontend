import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useMediaStream } from '../hooks/useMediaStream';
import type { MeetingAlert } from '../types';
import * as meetingService from '../services/meeting.service';

interface MeetingContextValue {
  activeMeetingId: string | null;
  streamTicket: string | null;
  ticketExpiresAt: string | null;
  liveAlerts: MeetingAlert[];
  media: ReturnType<typeof useMediaStream>;
  isStarting: boolean;
  isEnding: boolean;
  startError: string | null;
  setActiveMeeting: (id: string | null) => void;
  setStreamTicket: (ticket: string | null, expiresAt: string | null) => void;
  pushAlert: (alert: MeetingAlert) => void;
  resetMeetingState: () => void;
  startMeeting: (id: string) => Promise<void>;
  endMeeting: (id: string) => Promise<void>;
}

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [activeMeetingId, setActiveMeetingState] = useState<string | null>(null);
  const [streamTicket, setTicket] = useState<string | null>(null);
  const [ticketExpiresAt, setTicketExpiresAt] = useState<string | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<MeetingAlert[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  
  const media = useMediaStream();

  const pushAlert = useCallback((alert: MeetingAlert) => {
    setLiveAlerts((current) => [...current, alert]);
  }, []);

  const setStreamTicket = useCallback((ticket: string | null, expiresAt: string | null) => {
    setTicket(ticket);
    setTicketExpiresAt(expiresAt);
  }, []);

  const setActiveMeeting = useCallback((id: string | null) => {
    setActiveMeetingState(id);
  }, []);

  const resetMeetingState = useCallback(() => {
    setActiveMeetingState(null);
    setTicket(null);
    setTicketExpiresAt(null);
    setLiveAlerts([]);
    setStartError(null);
    media.stop();
  }, [media]);

  const startMeeting = useCallback(async (id: string) => {
    setIsStarting(true);
    setStartError(null);
    try {
      // 1. Verify media capture capability first
      await media.prepare();

      // 2. Only if capture is prepared, start the meeting on the backend
      const { streamTicket, ticketExpiresAt } = await meetingService.startMeeting(id);

      // 3. Start the actual recording/streaming
      setTicket(streamTicket);
      setTicketExpiresAt(ticketExpiresAt);
      await media.start(id, streamTicket);
    } catch (error) {
      console.error('Failed to start meeting:', error);
      const msg = error instanceof Error ? error.message : 'Failed to start meeting.';
      setStartError(msg);
      media.stop();
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, [media]);

  const endMeeting = useCallback(async (id: string) => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await meetingService.endMeeting(id);
      media.stop();
      setTicket(null);
      setTicketExpiresAt(null);
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
      media,
      isStarting,
      isEnding,
      startError,
      setActiveMeeting,
      setStreamTicket,
      pushAlert,
      resetMeetingState,
      startMeeting,
      endMeeting,
    }),
    [
      activeMeetingId, 
      streamTicket, 
      ticketExpiresAt, 
      liveAlerts, 
      media, 
      isStarting, 
      isEnding, 
      startError, 
      setActiveMeeting, 
      setStreamTicket, 
      pushAlert, 
      resetMeetingState,
      startMeeting,
      endMeeting
    ],
  );

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) {
    throw new Error('useMeeting must be used within MeetingProvider');
  }
  return ctx;
}
