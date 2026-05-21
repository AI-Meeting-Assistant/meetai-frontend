import { useState } from 'react';

interface EditMeetingModalProps {
  initialTitle: string;
  initialAgenda: string;
  onSave: (title: string, agenda: string) => Promise<void>;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function EditMeetingModal({ initialTitle, initialAgenda, onSave, onClose }: EditMeetingModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [agenda, setAgenda] = useState(initialAgenda);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError('Title is required.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed, agenda.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Meeting</h3>
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-3)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="em-title" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Title</label>
              <input id="em-title" type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={isSaving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="em-agenda" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Agenda</label>
              <textarea id="em-agenda" placeholder="Topics to cover…" value={agenda}
                onChange={e => setAgenda(e.target.value)} disabled={isSaving} rows={4} />
            </div>
            {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
