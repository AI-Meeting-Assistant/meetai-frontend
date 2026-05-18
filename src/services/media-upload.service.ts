const PYTHON_INGEST_BASE_URL =
  import.meta.env.VITE_PYTHON_INGEST_BASE_URL ?? 'http://localhost:8000';

// ─── Custom errors ────────────────────────────────────────────────────────────

export class StreamUnauthorizedError extends Error {
  constructor(message = 'Stream ticket unauthorized') {
    super(message);
    this.name = 'StreamUnauthorizedError';
  }
}

export class StreamBadRequestError extends Error {
  constructor(message = 'Bad request — gateway rejected the chunk') {
    super(message);
    this.name = 'StreamBadRequestError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadChunkPayload {
  /** Active meeting UUID */
  meetingId: string;
  /** Redis stream ticket from Node POST /api/v1/meetings/:id/start */
  streamTicket: string;
  /**
   * Start of this window relative to startedAt, in ms (client authoritative).
   * First window = 0. Contiguous windows: 0, D, 2D, …
   */
  offsetMs: number;
  /** JPEG frames captured during [offsetMs, offsetMs + D) */
  videoFrames: Blob[];
  /** Audio bytes for the same interval */
  audioChunk: Blob;
  /** Meeting title — forwarded to text worker for adherence analysis */
  title: string;
  /** Meeting agenda — forwarded to text worker for adherence analysis */
  agenda: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * POSTs one media window to the Python ingest gateway.
 *
 * Multipart fields sent:
 *   meetingId    (string)
 *   streamTicket (string)
 *   offsetMs     (string → int, multiples of meeting timeline resolution)
 *   audioChunk   (webm file)
 *   videoFrames[] (one JPEG file per frame, typically 55–60 per chunk)
 */
export async function uploadChunk(payload: UploadChunkPayload): Promise<void> {
  const { meetingId, streamTicket, offsetMs, audioChunk, videoFrames, title, agenda } = payload;

  const formData = new FormData();
  formData.append('meetingId', meetingId);
  formData.append('streamTicket', streamTicket);
  formData.append('offsetMs', String(offsetMs));
  formData.append('title', title);
  formData.append('agenda', agenda);
  formData.append('audioChunk', audioChunk, `audio_${offsetMs}.webm`);
  for (const [i, frame] of videoFrames.entries()) {
    formData.append('videoFrames[]', frame, `frame_${i}.jpg`);
  }

  const response = await fetch(`${PYTHON_INGEST_BASE_URL}/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (response.status === 401) {
    throw new StreamUnauthorizedError();
  }

  if (response.status === 400) {
    const body = await response.json().catch(() => null);
    const msg = body?.error?.message ?? 'Gateway rejected chunk (400)';
    throw new StreamBadRequestError(msg);
  }

  if (!response.ok) {
    throw new Error(`Media chunk upload failed (HTTP ${response.status})`);
  }
}
