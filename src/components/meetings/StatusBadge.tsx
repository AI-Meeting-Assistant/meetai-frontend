import type { MeetingStatus } from '../../types';

type ExtendedStatus = MeetingStatus | 'PROCESSING' | 'ERROR';

const STATUS_CONFIG: Record<ExtendedStatus, { label: string; cls: string; dot?: boolean }> = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'badge-scheduled' },
  IN_PROGRESS: { label: 'Live',        cls: 'badge-in-progress', dot: true },
  COMPLETED:   { label: 'Completed',   cls: 'badge-completed' },
  PROCESSING:  { label: 'Processing',  cls: 'badge-processing' },
  ERROR:       { label: 'Error',       cls: 'badge-error' },
};

export function StatusBadge({ status }: { status: ExtendedStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: '' };
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse 1.8s ease-in-out infinite',
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}
