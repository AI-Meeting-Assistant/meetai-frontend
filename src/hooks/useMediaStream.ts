import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StreamUnauthorizedError,
  StreamBadRequestError,
  uploadChunk,
} from '../services/media-upload.service';

interface UseMediaStreamResult {
  prepare: () => Promise<void>;
  start: (meetingId: string, streamTicket: string) => Promise<void>;
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

  // ── Recorders ────────────────────────────────────────────────────────────
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // ── Audio mixing ─────────────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);

  // ── Window tracking ──────────────────────────────────────────────────────
  /** Running offset counters (client-authoritative). */
  const videoOffsetRef = useRef<number>(0);
  const audioOffsetRef = useRef<number>(0);

  /**
   * Pending blobs keyed by offsetMs.
   * Each window fires two ondataavailable events (video + audio).
   * We hold the first arrival until the second arrives, then upload together.
   */
  const pendingRef = useRef<
    Map<number, { video?: Blob; audio?: Blob }>
  >(new Map());

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Picks the best supported video MIME type for the video-only recorder.
   */
  function pickVideoMime(): string {
    for (const t of [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ]) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  /**
   * Picks the best supported audio MIME type for the audio-only recorder.
   */
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

    for (const recorder of [videoRecorderRef.current, audioRecorderRef.current]) {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    }
    videoRecorderRef.current = null;
    audioRecorderRef.current = null;

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

    // Clear pending window state
    videoOffsetRef.current = 0;
    audioOffsetRef.current = 0;
    pendingRef.current.clear();

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
    async (meetingId: string, streamTicket: string) => {
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
        const videoOnlyStream  = new MediaStream(
          screenStreamRef.current.getVideoTracks(),
        );

        // ── Shared upload handler ─────────────────────────────────────────
        /**
         * Called when either the video or audio recorder delivers a chunk.
         * Buffers the blob until both sides are ready, then uploads.
         */
        const handleBlob = async (
          kind: 'video' | 'audio',
          windowOffset: number,
          blob: Blob,
        ) => {
          console.log(`[useMediaStream] Received ${kind} blob: size=${blob.size} bytes at offset ${windowOffset}`);

          const map = pendingRef.current;
          const entry = map.get(windowOffset) ?? {};
          entry[kind] = blob;
          map.set(windowOffset, entry);

          if (!entry.video || !entry.audio) {
            // Wait for the other half
            return;
          }

          // Both halves arrived — upload and clean up
          map.delete(windowOffset);
          const { video: videoChunk, audio: audioChunk } = entry as Required<typeof entry>;

          console.log(
            `[useMediaStream] Uploading window offsetMs=${windowOffset} ` +
            `(video=${videoChunk.size}B, audio=${audioChunk.size}B)`,
          );

          try {
            await uploadChunk({
              meetingId,
              streamTicket,
              offsetMs: windowOffset,
              videoChunk,
              audioChunk,
            });
          } catch (error) {
            console.error('[useMediaStream] Failed to upload chunk:', error);
            if (error instanceof StreamUnauthorizedError) {
              setStreamError('Stream ticket expired.');
              stop();
            } else if (error instanceof StreamBadRequestError) {
              setStreamError(`Gateway rejected window (offsetMs=${windowOffset}).`);
            }
          }
        };

        // ── Video recorder ────────────────────────────────────────────────
        const videoMime = pickVideoMime();
        const effectiveChunkDurationMs = chunkDurationRef.current;

        const videoRecorder = new MediaRecorder(videoOnlyStream, {
          mimeType: videoMime,
          videoBitsPerSecond: 1_000_000,
        });
        videoRecorderRef.current = videoRecorder;

        videoRecorder.ondataavailable = (event) => {
          const blob = event.data;
          if (blob.size === 0) {
            console.warn('[useMediaStream] Ignoring empty video blob (no offset advance)');
            return;
          }
          const offset = videoOffsetRef.current;
          videoOffsetRef.current += effectiveChunkDurationMs;
          void handleBlob('video', offset, blob);
        };

        // ── Audio recorder ────────────────────────────────────────────────
        const audioMime = pickAudioMime();
        const audioRecorder = new MediaRecorder(mergedAudioStream, {
          mimeType: audioMime,
        });
        audioRecorderRef.current = audioRecorder;

        audioRecorder.ondataavailable = (event) => {
          const blob = event.data;
          if (blob.size === 0) {
            console.warn('[useMediaStream] Ignoring empty audio blob (no offset advance)');
            return;
          }
          const offset = audioOffsetRef.current;
          audioOffsetRef.current += effectiveChunkDurationMs;
          void handleBlob('audio', offset, blob);
        };

        // ── Kick both recorders in step ───────────────────────────────────
        videoOffsetRef.current = 0;
        audioOffsetRef.current = 0;
        pendingRef.current.clear();

        // Timeslice matches gateway MEDIA_CHUNK_DURATION_MS so each Blob is typically a
        // standalone WebM segment (PyAV can av.open per POST). Avoid requestData()+start()
        // without timeslice — that yields Matroska continuation fragments and decode errors.
        videoRecorder.start(effectiveChunkDurationMs);
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