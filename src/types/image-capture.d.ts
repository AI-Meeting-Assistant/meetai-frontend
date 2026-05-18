// ImageCapture API — not yet in TypeScript's standard DOM lib
interface ImageCapture {
  grabFrame(): Promise<ImageBitmap>;
  takePhoto(): Promise<Blob>;
}

declare var ImageCapture: {
  prototype: ImageCapture;
  new(track: MediaStreamTrack): ImageCapture;
};
