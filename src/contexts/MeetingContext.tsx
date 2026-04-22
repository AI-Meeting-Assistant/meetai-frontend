import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MeetingAlert } from '../types';

interface MeetingContextValue {
  activeMeetingId: string | null;
  streamTicket: string | null;
  ticketExpiresAt: string | null;
  liveAlerts: MeetingAlert[];
  setActiveMeeting: (id: string | null) => void;
  setStreamTicket: (ticket: string | null, expiresAt: string | null) => void;
  pushAlert: (alert: MeetingAlert) => void;
  resetMeetingState: () => void;
}

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [activeMeetingId, setActiveMeeting] = useState<string | null>(null);
  const [streamTicket, setTicket] = useState<string | null>(null);
  const [ticketExpiresAt, setTicketExpiresAt] = useState<string | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<MeetingAlert[]>([]);

  const pushAlert = (alert: MeetingAlert) => {
    setLiveAlerts((current) => [...current, alert]);
  };

  const setStreamTicket = (ticket: string | null, expiresAt: string | null) => {
    setTicket(ticket);
    setTicketExpiresAt(expiresAt);
  };

  const resetMeetingState = () => {
    setActiveMeeting(null);
    setTicket(null);
    setTicketExpiresAt(null);
    setLiveAlerts([]);
  };

  const value = useMemo(
    () => ({
      activeMeetingId,
      streamTicket,
      ticketExpiresAt,
      liveAlerts,
      setActiveMeeting,
      setStreamTicket,
      pushAlert,
      resetMeetingState,
    }),
    [activeMeetingId, streamTicket, ticketExpiresAt, liveAlerts],
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
