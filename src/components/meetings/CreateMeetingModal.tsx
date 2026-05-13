import { useState } from 'react';

interface CreateMeetingModalProps {
  onCreate: (title: string, agenda?: string, timelineResolutionMs?: number) => Promise<void>;
  onClose: () => void;
}

export function CreateMeetingModal({ onCreate, onClose }: CreateMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [timelineResolutionMs, setTimelineResolutionMs] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const trimmedResolution = timelineResolutionMs.trim();
    const parsedResolution = trimmedResolution ? Number(trimmedResolution) : Number.NaN;
    const resolutionValue = Number.isFinite(parsedResolution) && parsedResolution > 0
      ? parsedResolution
      : undefined;
    await onCreate(title, agenda.trim() || undefined, resolutionValue);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Meeting</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="meeting-title">Title</label>
            <input
              id="meeting-title"
              type="text"
              placeholder="Q2 Planning"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="meeting-agenda">Agenda</label>
            <textarea
              id="meeting-agenda"
              placeholder="Topics to cover…"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="meeting-timeline-resolution">Timeline resolution (ms)</label>
            <input
              id="meeting-timeline-resolution"
              type="number"
              min="1"
              placeholder="2000"
              value={timelineResolutionMs}
              onChange={(event) => setTimelineResolutionMs(event.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
