import { apiRequest } from './api';
import type {
  CreateMeetingResponse,
  Meeting,
  MeetingAnalysis,
  MeetingTimelineEntry,
  MeetingType,
  PaginatedResponse,
} from '../types';

// ---------------------------------------------------------------------------
// Payloads & response shapes
// ---------------------------------------------------------------------------

export interface CreateMeetingPayload {
  title: string;
  agenda?: string | null;
  timelineResolutionMs?: number;
  meetingType?: MeetingType;
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

export interface ListMeetingsParams {
  page?: number;
  limit?: number;
  status?: string;
  meetingType?: string;
}

export async function listMeetings(params: ListMeetingsParams = {}): Promise<PaginatedResponse<Meeting>> {
  const query = new URLSearchParams();
  if (params.page)        query.set('page', String(params.page));
  if (params.limit)       query.set('limit', String(params.limit));
  if (params.status)      query.set('status', params.status);
  if (params.meetingType) query.set('meetingType', params.meetingType);
  const qs = query.toString();
  return apiRequest<PaginatedResponse<Meeting>>(`/meetings${qs ? `?${qs}` : ''}`);
}

export async function createMeeting(payload: CreateMeetingPayload): Promise<CreateMeetingResponse> {
  return apiRequest<CreateMeetingResponse>('/meetings', {
    method: 'POST',
    body: payload,
  });
}

export async function getMeetingAnalysis(id: string): Promise<MeetingAnalysis> {
  return apiRequest<MeetingAnalysis>(`/meetings/${id}`);
}

export async function getMeetingTimeline(id: string): Promise<MeetingTimelineEntry[]> {
  return apiRequest<MeetingTimelineEntry[]>(`/timeline/${id}`);
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

/** DELETE /meetings/:id — permanently deletes meeting and related data. */
export async function deleteMeeting(id: string): Promise<void> {
  await apiRequest<void>(`/meetings/${id}`, {
    method: 'DELETE',
  });
}

export async function exportReport(id: string, format: 'pdf'): Promise<string> {
  const data = await apiRequest<{ url: string }>(`/meetings/${id}/export?format=${format}`);
  return data.url;
}