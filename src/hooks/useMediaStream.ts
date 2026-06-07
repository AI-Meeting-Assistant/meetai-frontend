import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StreamUnauthorizedError,
  StreamBadRequestError,
  uploadChunk,
} from '../services/media-upload.service';
import { startJpegCapture } from '../utils/face-canvas-pipeline';

interface UseMediaStreamResult {
  prepare: () => Promise<void>;
  start: (
    meetingId: string,
    streamTicket: string,
    options?: {
      chunkDurationMs?: number;
      initialOffsetMs?: number;
      title?: string;
      agenda?: string;
      onChunkUploaded?: () => void;
    },
  ) => Promise<void>;
  stop: () => void;
  isCapturing: boolean;
  streamError: string | null;
}

export function useMediaStream(chunkDurationMs: number): UseMediaStreamResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const chunkDurationRef = useRef<number>(chunkDurationMs);

  useEffect(() => {
    chunkDurationRef.current = chunkDurationMs;
  }, [chunkDurationMs]);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef    = useRef<MediaStream | null>(null);

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const jpegCaptureRef   = useRef<{ flush: () => Blob[]; stop: () => void } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const offsetRef = useRef<number>(0);

  function pickAudioMime(): string {
    for (const t of [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ]) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  const stop = useCallback(() => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }
    audioRecorderRef.current = null;

    jpegCaptureRef.current?.stop();
    jpegCaptureRef.current = null;

    [screenStreamRef, micStreamRef].forEach(ref => {
      ref.current?.getTracks().forEach(t => t.stop());
      ref.current = null;
    });

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    offsetRef.current = 0;
    setIsCapturing(false);
  }, []);

  const prepare = useCallback(async () => {
    setStreamError(null);

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 10, max: 15 },
          width:     { ideal: 1280 },
          height:    { ideal: 720 },
        },
        audio: true,
      });
      screenStreamRef.current = screenStream;

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micStreamRef.current = micStream;
      } catch (micErr) {
        console.warn('[useMediaStream] Microphone access denied or failed:', micErr);
      }
    } catch (err) {
      console.error('[useMediaStream] Failed to prepare media stream:', err);
      let msg = 'Media capture not supported.';
      if (err instanceof Error) {
        msg = err.name === 'NotAllowedError' ? 'Permission denied.' : err.message;
      }
      setStreamError(msg);
      throw err;
    }
  }, []);

  const start = useCallback(
    async (
      meetingId: string,
      streamTicket: string,
      options?: {
        chunkDurationMs?: number;
        initialOffsetMs?: number;
        title?: string;
        agenda?: string;
        onChunkUploaded?: () => void;
      },
    ) => {
      try {
        if (!screenStreamRef.current) {
          await prepare();
        }
        if (!screenStreamRef.current) {
          throw new Error('Screen capture stream is missing after preparation.');
        }

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        if (screenStreamRef.current.getAudioTracks().length > 0) {
          audioContext
            .createMediaStreamSource(screenStreamRef.current)
            .connect(destination);
        }
        if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
          audioContext
            .createMediaStreamSource(micStreamRef.current)
            .connect(destination);
        }

        const mergedAudioStream = destination.stream;

        const effectiveChunkDurationMs = options?.chunkDurationMs ?? chunkDurationRef.current;
        const initialOffsetMs = options?.initialOffsetMs ?? 0;
        const title  = options?.title  ?? '';
        const agenda = options?.agenda ?? '';

        if (!Number.isFinite(effectiveChunkDurationMs) || effectiveChunkDurationMs <= 0) {
          throw new Error(`Invalid chunk duration: ${String(effectiveChunkDurationMs)}`);
        }
        if (!Number.isFinite(initialOffsetMs) || initialOffsetMs < 0) {
          throw new Error(`Invalid initial offset: ${String(initialOffsetMs)}`);
        }

        jpegCaptureRef.current = startJpegCapture(screenStreamRef.current.getVideoTracks()[0]);

        const audioMime = pickAudioMime();
        const audioRecorder = new MediaRecorder(mergedAudioStream, { mimeType: audioMime });
        audioRecorderRef.current = audioRecorder;

        audioRecorder.ondataavailable = (event) => {
          const audioBlob = event.data;
          if (audioBlob.size === 0) {
            console.warn('[useMediaStream] Ignoring empty audio blob');
            return;
          }
          const offset = offsetRef.current;
          offsetRef.current += effectiveChunkDurationMs;

          const videoFrames = jpegCaptureRef.current?.flush() ?? [];

          void (async () => {
            try {
              await uploadChunk({ meetingId, streamTicket, offsetMs: offset, audioChunk: audioBlob, videoFrames, title, agenda });
              options?.onChunkUploaded?.();
            } catch (error) {
              console.error('[useMediaStream] Failed to upload chunk:', error);
              if (error instanceof StreamUnauthorizedError) {
                setStreamError('Stream ticket expired.');
                stop();
              } else if (error instanceof StreamBadRequestError) {
                setStreamError(`Gateway rejected window (offsetMs=${offset}).`);
              }
            }
          })();
        };

        offsetRef.current = initialOffsetMs;
        audioRecorder.start(effectiveChunkDurationMs);

        setIsCapturing(true);
      } catch (err) {
        console.error('[useMediaStream] Failed to start recording:', err);
        setStreamError(
          err instanceof Error ? err.message : 'Failed to start recording.',
        );
        stop();
        throw err;
      }
    },
    [prepare, stop],
  );

  return useMemo(
    () => ({ prepare, start, stop, isCapturing, streamError }),
    [prepare, start, stop, isCapturing, streamError],
  );
}
