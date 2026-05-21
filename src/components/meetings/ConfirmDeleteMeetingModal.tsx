interface ConfirmDeleteMeetingModalProps {
  meetingTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteMeetingModal({ meetingTitle, onConfirm, onClose, isDeleting = false }: ConfirmDeleteMeetingModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete meeting</h3>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--tx-2)', margin: 0, lineHeight: 1.6 }}>
            This will permanently delete <strong style={{ color: 'var(--tx-1)' }}>{meetingTitle}</strong> and all
            associated data including the transcript, metrics, and AI summary. This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button type="button" className="btn-danger" onClick={() => void onConfirm()} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
