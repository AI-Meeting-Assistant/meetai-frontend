import type { Meeting } from '../../types';
import { StatusBadge } from './StatusBadge';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: (meeting: Meeting) => void;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <button type="button" onClick={() => onClick(meeting)}>
      <h3>{meeting.title}</h3>
      <p>{meeting.agenda}</p>
      <StatusBadge status={meeting.status} />
    </button>
  );
}
