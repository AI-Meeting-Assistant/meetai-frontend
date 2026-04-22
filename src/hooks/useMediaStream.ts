import { useRef, useState } from 'react';
import { StreamUnauthorizedError, uploadChunk } from '../services/media-upload.service';

interface UseMediaStreamResult {
  start: (meetingId: string, streamTicket: string) => Promise<void>;
  stop: () => void;
  isCapturing: boolean;
  streamError: string | null;
}

export function useMediaStream(): UseMediaStreamResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    combinedStreamRef.current?.getTracks().forEach((track) => track.stop());
    combinedStreamRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setIsCapturing(false);
  };

  const start = async (meetingId: string, streamTicket: string) => {
    setStreamError(null);
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const destination = audioContext.createMediaStreamDestination();

    const screenAudio = audioContext.createMediaStreamSource(screenStream);
    const micAudio = audioContext.createMediaStreamSource(micStream);
    screenAudio.connect(destination);
    micAudio.connect(destination);

    const videoTrack = screenStream.getVideoTracks()[0];
    const mergedAudioTrack = destination.stream.getAudioTracks()[0];
    const mergedStream = new MediaStream([videoTrack, mergedAudioTrack]);
    combinedStreamRef.current = mergedStream;

    const recorder = new MediaRecorder(mergedStream, { mimeType: 'video/webm' });
    recorderRef.current = recorder;
    recorder.ondataavailable = async (event) => {
      if (event.data.size === 0) {
        return;
      }

      try {
        await uploadChunk({
          meetingId,
          streamTicket,
          mediaChunk: event.data,
        });
      } catch (error) {
        if (error instanceof StreamUnauthorizedError) {
          setStreamError('Stream ticket unauthorized or expired.');
          stop();
          return;
        }
        setStreamError('Failed to upload media chunk.');
      }
    };

    recorder.start(2000);
    setIsCapturing(true);
  };

  return { start, stop, isCapturing, streamError };
}
