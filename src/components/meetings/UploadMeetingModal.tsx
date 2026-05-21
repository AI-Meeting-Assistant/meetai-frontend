import { useCallback, useEffect, useRef, useState } from 'react';
import * as meetingService from '../../services/meeting.service';
import {
  RECORDED_ACCEPT_EXTENSIONS,
  uploadRecording,
  validateRecordedFile,
} from '../../services/media-upload.service';
import { SlideOver } from '../common/SlideOver';

interface UploadMeetingModalProps {
  open: boolean;
  onSuccess: (meetingId: string) => void;
  onClose: () => void;
}

type Phase = 'idle' | 'creating' | 'uploading' | 'error';

export function UploadMeetingModal({ open, onSuccess, onClose }: UploadMeetingModalProps) {
  const [title, setTitle]               = useState('');
  const [agenda, setAgenda]             = useState('');
  const [file, setFile]                 = useState<File | null>(null);
  const [phase, setPhase]               = useState<Phase>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError]               = useState<string | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const meetingIdRef  = useRef<string | null>(null);

  const isBusy = phase === 'creating' || phase === 'uploading';
  const acceptAttr = RECORDED_ACCEPT_EXTENSIONS.join(',');

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setAgenda('');
      setFile(null);
      setPhase('idle');
      setUploadPercent(0);
      setError(null);
      setIsDragging(false);
    }
  }, [open]);

  const pickFile = useCallback((candidate: File | null) => {
    if (!candidate) return;
    const validationError = validateRecordedFile(candidate);
    if (validationError) { setError(validationError); setFile(null); return; }
    setError(null);
    setFile(candidate);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const cleanupMeeting = async () => {
    const id = meetingIdRef.current;
    if (!id) return;
    try { await meetingService.deleteMeeting(id); } catch { /* best-effort */ }
    meetingIdRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file || isBusy) return;
    setError(null);
    setPhase('creating');
    try {
      const created = await meetingService.createMeeting({
        title: title.trim(), agenda: agenda.trim() || undefined, meetingType: 'RECORDED',
      });
      if (!created.streamTicket) throw new Error('Server did not return a stream ticket');
      meetingIdRef.current = created.id;
      setPhase('uploading');
      setUploadPercent(0);
      await uploadRecording({
        meetingId: created.id, streamTicket: created.streamTicket,
        file, title: title.trim(), agenda: agenda.trim(), onProgress: setUploadPercent,
      });
      meetingIdRef.current = null;
      onSuccess(created.id);
      onClose();
    } catch (err) {
      await cleanupMeeting();
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  // Block close while uploading
  const handleClose = () => { if (!isBusy) onClose(); };

  const submitLabel =
    phase === 'creating' ? 'Creating…' : phase === 'uploading' ? 'Uploading…' : 'Upload & Process';

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Upload Meeting"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={handleClose} disabled={isBusy}>Cancel</button>
          <button type="submit" form="upload-meeting-form" className="btn-primary"
            disabled={isBusy || !title.trim() || !file}>
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="upload-meeting-form" onSubmit={(e) => void handleSubmit(e)}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="um-title" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Title</label>
          <input id="um-title" type="text" placeholder="Q2 Planning"
            value={title} onChange={e => setTitle(e.target.value)} disabled={isBusy} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="um-agenda" style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Agenda</label>
          <textarea id="um-agenda" rows={4} placeholder="Topics covered…"
            value={agenda} onChange={e => setAgenda(e.target.value)} disabled={isBusy} />
        </div>

        {/* Drag-and-drop zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-2)' }}>Audio / video file</label>
          <div
            role="button" tabIndex={0}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && !isBusy && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)', padding: '32px 20px',
              textAlign: 'center', cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
              background: isDragging ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input ref={fileInputRef} type="file" accept={acceptAttr}
              style={{ display: 'none' }} disabled={isBusy}
              onChange={e => pickFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-1)' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 3 }}>{formatFileSize(file.size)}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 4 }}>Drag & drop or click to select</div>
                <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>
                  {RECORDED_ACCEPT_EXTENSIONS.join(' ')} — max 500 MB
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload progress */}
        {phase === 'uploading' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx-3)', marginBottom: 6 }}>
              <span>Uploading…</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{uploadPercent}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${uploadPercent}%`, height: '100%',
                background: 'var(--accent)', borderRadius: 3, transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
      </form>
    </SlideOver>
  );
}
