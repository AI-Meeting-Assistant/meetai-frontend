interface MeetingControlsProps {
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
  isCapturing: boolean;
}

export function MeetingControls({ onStart, onEnd, isCapturing }: MeetingControlsProps) {
  return (
    <section>
      <button type="button" onClick={() => void onStart()} disabled={isCapturing}>
        Start Meeting
      </button>
      <button type="button" onClick={() => void onEnd()}>
        End Meeting
      </button>
    </section>
  );
}
