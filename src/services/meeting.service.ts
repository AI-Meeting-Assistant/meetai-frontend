import { apiRequest } from './api';
import type { Meeting, MeetingAnalysis, MeetingStatus } from '../types';

export interface CreateMeetingPayload {
  title: string;
  agenda: string;
}

export interface UpdateStatusResponse {
  meeting: Meeting;
  streamTicket?: string;
  ticketExpiresAt?: string;
}

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

export async function updateStatus(id: string, status: MeetingStatus): Promise<UpdateStatusResponse> {
  return apiRequest<UpdateStatusResponse>(`/meetings/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function exportReport(id: string, format: 'pdf'): Promise<string> {
  const data = await apiRequest<{ url: string }>(`/meetings/${id}/export?format=${format}`);
  return data.url;
}
