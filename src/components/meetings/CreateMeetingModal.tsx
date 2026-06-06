import { useEffect, useState } from 'react';
import { SlideOver } from '../common/SlideOver';

const LIVE_TIMELINE_RESOLUTION_MS = 6000;

interface CreateMeetingModalProps {
  open: boolean;
  onCreate: (title: string, agenda?: string, timelineResolutionMs?: number) => Promise<void>;
  onClose: () => void;
}

export function CreateMeetingModal({ open, onCreate, onClose }: CreateMeetingModalProps) {
  const [title, setTitle]           = useState('');
  const [agenda, setAgenda]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Reset form state each time the panel opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setAgenda('');
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await onCreate(title.trim(), agenda.trim() || undefined, LIVE_TIMELINE_RESOLUTION_MS);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="New Meeting"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-meeting-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Meeting'}
          </button>
        </>
      }
    >
      <form id="create-meeting-form" onSubmit={(e) => void handleSubmit(e)}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="cm-title" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Title</label>
          <input id="cm-title" type="text" placeholder="Q2 Planning"
            value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="cm-agenda" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Agenda</label>
          <textarea id="cm-agenda" rows={5} placeholder="Topics to cover…"
            value={agenda} onChange={e => setAgenda(e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div style={{
          padding: '12px 14px', background: 'var(--bg-subtle)',
          borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.6,
        }}>
          All audio and video processing runs locally on your device. No media leaves your machine.
        </div>

        {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
      </form>
    </SlideOver>
  );
}
