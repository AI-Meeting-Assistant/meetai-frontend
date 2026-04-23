import { apiRequest } from './api';
import type { Meeting, MeetingAnalysis } from '../types';

// ---------------------------------------------------------------------------
// Payloads & response shapes
// ---------------------------------------------------------------------------

export interface CreateMeetingPayload {
  title: string;
  agenda?: string | null;
}

export interface UpdateMeetingPayload {
  title?: string;
  agenda?: string | null;
}

/** PATCH /meetings/:id — updates title/agenda only, no status change. */
export type UpdateMeetingResponse = Meeting;

/** POST /meetings/:id/start — returns stream credentials, does NOT return the full meeting object. */
export interface StartMeetingResponse {
  streamTicket: string;
  ticketExpiresAt: string;
}

/** POST /meetings/:id/end — returns the completed meeting object. */
export type EndMeetingResponse = Meeting;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  return apiRequest<Meeting[]>('/meetings');
}

export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  return apiRequest<Meeting>('/meetings', {
    method: 'POST',
    body: payload,
  });
}

export async function getMeetingAnalysis(id: string): Promise<MeetingAnalysis> {
  return apiRequest<MeetingAnalysis>(`/meetings/${id}`);
}

/** PATCH /meetings/:id — updates meeting title and/or agenda. */
export async function updateMeeting(id: string, payload: UpdateMeetingPayload): Promise<UpdateMeetingResponse> {
  return apiRequest<UpdateMeetingResponse>(`/meetings/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

/** POST /meetings/:id/start — transitions SCHEDULED → IN_PROGRESS and issues a stream ticket. */
export async function startMeeting(id: string): Promise<StartMeetingResponse> {
  return apiRequest<StartMeetingResponse>(`/meetings/${id}/start`, {
    method: 'POST',
  });
}

/** POST /meetings/:id/end — transitions IN_PROGRESS → COMPLETED and stamps endedAt. */
export async function endMeeting(id: string): Promise<EndMeetingResponse> {
  return apiRequest<EndMeetingResponse>(`/meetings/${id}/end`, {
    method: 'POST',
  });
}

export async function exportReport(id: string, format: 'pdf'): Promise<string> {
  const data = await apiRequest<{ url: string }>(`/meetings/${id}/export?format=${format}`);
  return data.url;
}