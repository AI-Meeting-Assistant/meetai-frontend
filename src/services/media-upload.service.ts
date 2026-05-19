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

// ─── Recorded meeting upload ──────────────────────────────────────────────────

const MAX_RECORDED_FILE_BYTES = 500 * 1024 * 1024;

export const RECORDED_ACCEPT_EXTENSIONS = [
  '.mp3', '.wav', '.m4a', '.ogg', '.flac',
  '.mp4', '.mov', '.mkv', '.webm',
];

export interface UploadRecordingPayload {
  meetingId: string;
  streamTicket: string;
  file: File;
  title: string;
  agenda: string;
  onProgress?: (percent: number) => void;
}

export function validateRecordedFile(file: File): string | null {
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : '';
  if (!RECORDED_ACCEPT_EXTENSIONS.includes(ext)) {
    return `Unsupported file type. Allowed: ${RECORDED_ACCEPT_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_RECORDED_FILE_BYTES) {
    return 'File exceeds maximum size of 500 MB';
  }
  if (file.size === 0) {
    return 'File is empty';
  }
  return null;
}

export function uploadRecording(payload: UploadRecordingPayload): Promise<void> {
  const { meetingId, streamTicket, file, title, agenda, onProgress } = payload;

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('meetingId', meetingId);
    formData.append('streamTicket', streamTicket);
    formData.append('title', title);
    formData.append('agenda', agenda);
    formData.append('file', file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${PYTHON_INGEST_BASE_URL}/ingest-recorded`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new StreamUnauthorizedError());
        return;
      }
      if (xhr.status === 400) {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new StreamBadRequestError(body?.error?.message ?? 'Bad request'));
        } catch {
          reject(new StreamBadRequestError());
        }
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Recorded upload failed (HTTP ${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(formData);
  });
}
