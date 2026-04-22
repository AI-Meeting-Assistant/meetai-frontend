import type { MeetingStatus } from '../../types';

const STATUS_LABELS: Record<MeetingStatus, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  const cls = `badge badge-${status.toLowerCase().replace('_', '-')}`;
  return <span className={cls}>{STATUS_LABELS[status]}</span>;
}
