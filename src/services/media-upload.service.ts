const PYTHON_INGEST_BASE_URL = import.meta.env.VITE_PYTHON_INGEST_BASE_URL ?? 'http://localhost:8000';

export class StreamUnauthorizedError extends Error {
  constructor(message = 'Stream ticket unauthorized') {
    super(message);
    this.name = 'StreamUnauthorizedError';
  }
}

interface UploadChunkPayload {
  meetingId: string;
  streamTicket: string;
  mediaChunk: Blob;
}

export async function uploadChunk(payload: UploadChunkPayload): Promise<void> {
  const formData = new FormData();
  formData.append('meetingId', payload.meetingId);
  formData.append('streamTicket', payload.streamTicket);
  formData.append('mediaChunk', payload.mediaChunk, 'chunk.webm');

  const response = await fetch(`${PYTHON_INGEST_BASE_URL}/ingest/chunk`, {
    method: 'POST',
    body: formData,
  });

  if (response.status === 401) {
    throw new StreamUnauthorizedError();
  }

  if (!response.ok) {
    throw new Error('Media chunk upload failed');
  }
}
