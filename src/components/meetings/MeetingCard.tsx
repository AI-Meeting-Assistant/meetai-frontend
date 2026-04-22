import type { Meeting } from '../../types';
import { StatusBadge } from './StatusBadge';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: (meeting: Meeting) => void;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <button type="button" className="card-clickable" onClick={() => onClick(meeting)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <h3>{meeting.title}</h3>
        <StatusBadge status={meeting.status} />
      </div>
      {meeting.agenda && (
        <p style={{ marginTop: '6px', fontSize: 'var(--text-sm)' }}>{meeting.agenda}</p>
      )}
    </button>
  );
}
