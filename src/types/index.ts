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
  focusRate?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export type SseEventType =
  | 'CONNECTED'
  | 'FUSED_DATA'
  | 'FOCUS_DROP'
  | 'FOCUS_RECOVERED'
  | 'SPEAKING_RATE_DROP'
  | 'SPEAKING_RATE_RECOVERED'
  | 'AGENDA_DEVIATION';

export interface FusedDataPayload {
  meetingId: string;
  offsetMs: number;
  audio: {
    vadSpeechMs: number | null;
    vadSilenceMs: number | null;
    vadSpeechRatioPercent: number | null;
    transcript: string | null;
    speakerLabelsWindow: unknown[] | null;
  };
  video: {
    focusScore: number;
    persons: Array<{
      personId: number;
      focusScore: number;
      speakingRatio: number;
      frameCount: number;
    }>;
  };
}

export interface LiveAlert {
  type: Exclude<SseEventType, 'CONNECTED' | 'FUSED_DATA'>;
  offsetMs: number;
  avg?: number;
  contextFit?: number;
}
