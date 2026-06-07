/**
 * Captures JPEG frames from a video track at ~10fps.
 *
 * Frames accumulate in an internal buffer. Call flush() to retrieve and clear
 * the buffer (returns all frames captured since the last flush). The audio
 * recorder's ondataavailable is the upload trigger — it calls flush() and
 * sends the frames together with the audio blob to /ingest.
 */
export function startJpegCapture(
  videoTrack: MediaStreamTrack,
): { flush: () => Blob[]; stop: () => void } {
  const imageCapture = new ImageCapture(videoTrack);
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let frames: Blob[] = [];
  let stopped = false;

  const intervalId = setInterval(() => {
    if (stopped) return;
    void (async () => {
      try {
        const bitmap = await imageCapture.grabFrame();
        if (stopped) { bitmap.close(); return; }

        if (!canvas || canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
          canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          ctx = canvas.getContext('2d')!;
        }
        ctx!.drawImage(bitmap, 0, 0);
        bitmap.close();

        canvas.toBlob((blob) => {
          if (!blob || stopped) return;
          frames.push(blob);
        }, 'image/jpeg', 0.82);
      } catch (err) {
        console.warn('[JpegCapture] grabFrame error:', err);
      }
    })();
  }, 100);

  return {
    flush(): Blob[] {
      const batch = frames;
      frames = [];
      return batch;
    },
    stop(): void {
      stopped = true;
      clearInterval(intervalId);
      frames = [];
    },
  };
}
