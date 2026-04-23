import { useRef, useState, useCallback, useMemo } from 'react';
import { StreamUnauthorizedError, uploadChunk } from '../services/media-upload.service';

interface UseMediaStreamResult {
  prepare: () => Promise<void>;
  start: (meetingId: string, streamTicket: string) => Promise<void>;
  stop: () => void;
  isCapturing: boolean;
  streamError: string | null;
}

export function useMediaStream(): UseMediaStreamResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    console.log('Stopping media stream and recording...');
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    [screenStreamRef, micStreamRef, combinedStreamRef].forEach(ref => {
      ref.current?.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      ref.current = null;
    });

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const prepare = useCallback(async () => {
    console.log('Preparing media streams...');
    setStreamError(null);
    try {
      console.log('Requesting screen capture...');
      const constraints: DisplayMediaStreamOptions = {
        video: {
          frameRate: { ideal: 10, max: 15 },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      console.log('Screen capture obtained.');
      screenStreamRef.current = screenStream;

      try {
        console.log('Requesting microphone access...');
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        console.log('Microphone access obtained.');
        micStreamRef.current = micStream;
      } catch (micErr) {
        console.warn('Microphone access denied or failed:', micErr);
      }
    } catch (err) {
      console.error('Failed to prepare media stream:', err);
      let msg = 'Media capture not supported.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') msg = 'Permission denied.';
        else msg = err.message;
      }
      setStreamError(msg);
      throw err;
    }
  }, []);

  const start = useCallback(async (meetingId: string, streamTicket: string) => {
    console.log(`Starting recording for meeting: ${meetingId}`);
    try {
      if (!screenStreamRef.current) {
        console.log('No screen stream found, preparing...');
        await prepare();
      }

      if (!screenStreamRef.current) {
        throw new Error('Screen capture stream is missing after preparation.');
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      if (screenStreamRef.current.getAudioTracks().length > 0) {
        console.log('Connecting screen audio to destination...');
        audioContext.createMediaStreamSource(screenStreamRef.current).connect(destination);
      }

      if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
        console.log('Connecting mic audio to destination...');
        audioContext.createMediaStreamSource(micStreamRef.current).connect(destination);
      }

      const tracks: MediaStreamTrack[] = [];
      const videoTrack = screenStreamRef.current.getVideoTracks()[0];
      const mergedAudioTrack = destination.stream.getAudioTracks()[0];

      if (videoTrack) tracks.push(videoTrack);
      if (mergedAudioTrack) tracks.push(mergedAudioTrack);

      if (tracks.length === 0) {
        throw new Error('No audio or video tracks available to record.');
      }

      console.log(`Creating MediaStream with ${tracks.length} tracks.`);
      const mergedStream = new MediaStream(tracks);
      combinedStreamRef.current = mergedStream;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      console.log(`Starting MediaRecorder with mimeType: ${mimeType}`);
      const recorder = new MediaRecorder(mergedStream, {
        mimeType,
        videoBitsPerSecond: 1000000
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;
        console.log(`Media chunk available: ${event.data.size} bytes`);
        try {
          await uploadChunk({ meetingId, streamTicket, mediaChunk: event.data });
        } catch (error) {
          console.error('Failed to upload media chunk:', error);
          if (error instanceof StreamUnauthorizedError) {
            setStreamError('Stream ticket expired.');
            stop();
          }
        }
      };

      recorder.start(2000);
      setIsCapturing(true);
      console.log('Recording started successfully.');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setStreamError(err instanceof Error ? err.message : 'Failed to start recording.');
      stop();
      throw err;
    }
  }, [prepare, stop]);

  return useMemo(() => ({
    prepare,
    start,
    stop,
    isCapturing,
    streamError
  }), [prepare, start, stop, isCapturing, streamError]);
}