export type UserRole = 'MODERATOR' | 'VIEWER';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type MeetingType = 'LIVE' | 'RECORDED';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  meetingType?: MeetingType;
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

export type SseEventType =
  | 'CONNECTED'
  | 'FUSED_DATA'
  | 'FOCUS_DROP'
  | 'FOCUS_RECOVERED'
  | 'SPEAKING_RATE_DROP'
  | 'SPEAKING_RATE_RECOVERED'
  | 'AGENDA_DEVIATION'
  | 'AGENDA_FIT'
  | 'MEETING_COMPLETED'
  | 'MEETING_FAILED'
  | 'SUMMARY_READY';

export interface CreateMeetingResponse extends Meeting {
  streamTicket?: string;
  ticketExpiresAt?: string;
}

export interface RecordedTranscriptLine {
  speaker: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface RecordedSpeaker {
  label: string;
  talkMs: number;
  ratioPercent: number;
}

export interface RecordedAnalysisPayload {
  meetingId: string;
  offsetMs: number;
  aiSummary?: string | null;
  audio: FusedDataPayload['audio'] & {
    speakerTalkMs?: Record<string, number> | null;
    speakerTalkRatioPercent?: Record<string, number> | null;
  };
  video: null;
  recorded: {
    durationMs: number;
    transcriptLines: RecordedTranscriptLine[];
    speakers: RecordedSpeaker[];
    adherence: {
      score: number | null;
      onTopic: boolean | null;
      reason: string | null;
    };
  };
}

export interface TranscriptLine {
  text: string;
  speaker: string;
}

export interface FusedDataPayload {
  meetingId: string;
  offsetMs: number;
  audio: {
    transcript: string | null;
    vadSpeechMs: number | null;
    vadSilenceMs: number | null;
    vadSpeechRatioPercent: number | null;
    speakerTalkMs: Record<string, number> | null;
    transcriptLines: TranscriptLine[] | null;
    speakerLabelsWindow: unknown[] | null;
    speakerTalkRatioPercent: Record<string, number> | null;
  };
  video: {
    focusScore: number | null;
    persons: Array<{ personId?: number }>;
  };
}

export interface LiveAlert {
  type: Exclude<SseEventType, 'CONNECTED' | 'FUSED_DATA' | 'MEETING_COMPLETED' | 'MEETING_FAILED' | 'SUMMARY_READY'>;
  offsetMs: number;
  avg?: number;
  contextFit?: number;
}

export interface LiveTranscriptLine {
  speaker: string;
  text: string;
}

export interface LiveTranscriptBlock {
  offsetMs: number;
  lines: LiveTranscriptLine[];
}
