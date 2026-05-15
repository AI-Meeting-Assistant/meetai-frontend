interface ConfirmDeleteMeetingModalProps {
  meetingTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteMeetingModal({
  meetingTitle,
  onConfirm,
  onClose,
  isDeleting = false,
}: ConfirmDeleteMeetingModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete Meeting</h3>
        </div>
        <p style={{ padding: '0 1.5rem 1rem', margin: 0, color: 'var(--text-secondary)' }}>
          Are you sure you want to delete &quot;{meetingTitle}&quot;? This action cannot be undone.
          All timeline data and alerts will be permanently removed.
        </p>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
