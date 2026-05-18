import { useState } from 'react';

interface EditMeetingModalProps {
  initialTitle: string;
  initialAgenda: string;
  onSave: (title: string, agenda: string) => Promise<void>;
  onClose: () => void;
}

export function EditMeetingModal({
  initialTitle,
  initialAgenda,
  onSave,
  onClose,
}: EditMeetingModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [agenda, setAgenda] = useState(initialAgenda);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmedTitle, agenda.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Meeting</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="edit-meeting-title">Title</label>
            <input
              id="edit-meeting-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-meeting-agenda">Agenda</label>
            <textarea
              id="edit-meeting-agenda"
              placeholder="Topics to cover…"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              disabled={isSaving}
            />
          </div>
          {error && (
            <p style={{ color: 'var(--color-danger, #c62828)', fontSize: 'var(--text-sm)', margin: '0 1.5rem' }}>
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
