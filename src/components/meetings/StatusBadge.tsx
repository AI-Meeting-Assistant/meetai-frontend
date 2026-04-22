import type { MeetingStatus } from '../../types';

export function StatusBadge({ status }: { status: MeetingStatus }) {
  return <span>{status}</span>;
}
