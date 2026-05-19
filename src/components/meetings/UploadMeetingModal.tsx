import { useCallback, useRef, useState } from 'react';
import * as meetingService from '../../services/meeting.service';
import {
  RECORDED_ACCEPT_EXTENSIONS,
  uploadRecording,
  validateRecordedFile,
} from '../../services/media-upload.service';

interface UploadMeetingModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

type Phase = 'idle' | 'creating' | 'uploading' | 'error';

export function UploadMeetingModal({ onSuccess, onClose }: UploadMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meetingIdRef = useRef<string | null>(null);

  const isBusy = phase === 'creating' || phase === 'uploading';
  const acceptAttr = RECORDED_ACCEPT_EXTENSIONS.join(',');

  const pickFile = useCallback((candidate: File | null) => {
    if (!candidate) return;
    const validationError = validateRecordedFile(candidate);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0] ?? null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const cleanupMeeting = async () => {
    const id = meetingIdRef.current;
    if (!id) return;
    try {
      await meetingService.deleteMeeting(id);
    } catch {
      // best-effort
    }
    meetingIdRef.current = null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !file || isBusy) return;

    setError(null);
    setPhase('creating');

    try {
      const created = await meetingService.createMeeting({
        title: title.trim(),
        agenda: agenda.trim() || undefined,
        meetingType: 'RECORDED',
      });

      if (!created.streamTicket) {
        throw new Error('Server did not return a stream ticket');
      }

      meetingIdRef.current = created.id;
      setPhase('uploading');
      setUploadPercent(0);

      await uploadRecording({
        meetingId: created.id,
        streamTicket: created.streamTicket,
        file,
        title: title.trim(),
        agenda: agenda.trim(),
        onProgress: setUploadPercent,
      });

      meetingIdRef.current = null;
      onSuccess();
      onClose();
    } catch (err) {
      await cleanupMeeting();
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleBackdropClick = () => {
    if (!isBusy) onClose();
  };

  const submitLabel =
    phase === 'creating' ? 'Creating…' : phase === 'uploading' ? 'Uploading…' : 'Upload & Process';

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Meeting</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="upload-meeting-title">Title</label>
            <input
              id="upload-meeting-title"
              type="text"
              placeholder="Q2 Planning"
              value={title}
              disabled={isBusy}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="upload-meeting-agenda">Agenda</label>
            <textarea
              id="upload-meeting-agenda"
              placeholder="Topics to cover…"
              value={agenda}
              disabled={isBusy}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Audio / video file</label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && !isBusy && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                textAlign: 'center',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.6 : 1,
                background: isDragging ? 'var(--color-surface-elevated)' : 'transparent',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                style={{ display: 'none' }}
                disabled={isBusy}
                onChange={handleFileChange}
              />
              {file ? (
                <div>
                  <strong>{file.name}</strong>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Drag & drop or click to select
                  <br />
                  <span style={{ fontSize: 'var(--text-xs)' }}>
                    {RECORDED_ACCEPT_EXTENSIONS.join(' ')} — max 500 MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {phase === 'uploading' && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', marginBottom: 4 }}>Uploading… {uploadPercent}%</p>
              <div
                style={{
                  height: 8,
                  background: 'var(--color-border)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${uploadPercent}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
              {error}
            </p>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isBusy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isBusy || !title.trim() || !file}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
