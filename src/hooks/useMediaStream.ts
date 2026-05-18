import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StreamUnauthorizedError,
  StreamBadRequestError,
  uploadChunk,
} from '../services/media-upload.service';
import { loadFaceModel, startJpegCapture } from '../utils/face-canvas-pipeline';

interface UseMediaStreamResult {
  prepare: () => Promise<void>;
  start: (
    meetingId: string,
    streamTicket: string,
    options?: {
      chunkDurationMs?: number;
      initialOffsetMs?: number;
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

  // ── Raw streams ──────────────────────────────────────────────────────────
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef    = useRef<MediaStream | null>(null);

  // ── Recorders / capture ──────────────────────────────────────────────────
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const jpegCaptureRef   = useRef<{ flush: () => Blob[]; stop: () => void } | null>(null);

  // ── Audio mixing ─────────────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);

  // ── Offset tracking (single counter — audio drives the cadence) ──────────
  const offsetRef = useRef<number>(0);

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  // ── stop ──────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    console.log('[useMediaStream] Stopping...');

    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }
    audioRecorderRef.current = null;

    jpegCaptureRef.current?.stop();
    jpegCaptureRef.current = null;

    [screenStreamRef, micStreamRef].forEach(ref => {
      ref.current?.getTracks().forEach(t => {
        console.log(`[useMediaStream] Stopping track: ${t.kind}`);
        t.stop();
      });
      ref.current = null;
    });

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    offsetRef.current = 0;
    setIsCapturing(false);
  }, []);

  // ── prepare ───────────────────────────────────────────────────────────────

  const prepare = useCallback(async () => {
    console.log('[useMediaStream] Preparing media streams...');
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
      console.log('[useMediaStream] Screen capture obtained.');
      screenStreamRef.current = screenStream;
      await loadFaceModel();

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        console.log('[useMediaStream] Microphone access obtained.');
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

  // ── start ─────────────────────────────────────────────────────────────────

  const start = useCallback(
    async (
      meetingId: string,
      streamTicket: string,
      options?: {
        chunkDurationMs?: number;
        initialOffsetMs?: number;
      },
    ) => {
      console.log(`[useMediaStream] Starting recording for meeting: ${meetingId}`);

      try {
        if (!screenStreamRef.current) {
          console.log('[useMediaStream] No screen stream found, preparing...');
          await prepare();
        }
        if (!screenStreamRef.current) {
          throw new Error('Screen capture stream is missing after preparation.');
        }

        // ── Build the mixed-audio stream ──────────────────────────────────
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

        if (!Number.isFinite(effectiveChunkDurationMs) || effectiveChunkDurationMs <= 0) {
          throw new Error(`Invalid chunk duration: ${String(effectiveChunkDurationMs)}`);
        }
        if (!Number.isFinite(initialOffsetMs) || initialOffsetMs < 0) {
          throw new Error(`Invalid initial offset: ${String(initialOffsetMs)}`);
        }

        // ── JPEG capture ──────────────────────────────────────────────────
        jpegCaptureRef.current = startJpegCapture(screenStreamRef.current.getVideoTracks()[0]);

        // ── Audio recorder ────────────────────────────────────────────────
        // The audio recorder drives the upload cadence. On each chunk, we flush
        // the accumulated JPEG frames and POST both together to /ingest.
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
          console.log(
            `[useMediaStream] Uploading offsetMs=${offset} ` +
            `audio=${audioBlob.size}B frames=${videoFrames.length}`,
          );

          void (async () => {
            try {
              await uploadChunk({ meetingId, streamTicket, offsetMs: offset, audioChunk: audioBlob, videoFrames });
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
        console.log('[useMediaStream] Recording started successfully.');
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

  // ── Public API ────────────────────────────────────────────────────────────

  return useMemo(
    () => ({ prepare, start, stop, isCapturing, streamError }),
    [prepare, start, stop, isCapturing, streamError],
  );
}
