interface MeetingControlsProps {
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
  isCapturing: boolean;
}

export function MeetingControls({ onStart, onEnd, isCapturing }: MeetingControlsProps) {
  return (
    <div className="dashboard-controls-buttons">
      <button type="button" className="btn-primary" onClick={() => void onStart()} disabled={isCapturing}>
        Start Meeting
      </button>
      <button type="button" className="btn-danger" onClick={() => void onEnd()}>
        End Meeting
      </button>
    </div>
  );
}
