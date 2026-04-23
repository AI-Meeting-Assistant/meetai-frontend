export type UserRole = 'MODERATOR' | 'VIEWER';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string | null;
  status: MeetingStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  aiSummary?: string | null;
  timelineResolutionMs?: number;
  organizationId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingAlert {
  id: string;
  severity: string;
  eventType: string;
  message: string;
  createdAt: string;
  payload?: unknown;
}

export interface MeetingTimelineEntry {
  offsetMs: number;
  payload: unknown;
}

export interface MeetingAnalysis {
  meeting: Meeting;
  timeline: MeetingTimelineEntry[];
  alerts: MeetingAlert[];
  aiSummary?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}
