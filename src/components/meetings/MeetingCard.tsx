import type { Meeting } from '../../types';
import { StatusBadge } from './StatusBadge';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: (meeting: Meeting) => void;
}

function MeetingTypeIcon({ meetingType }: { meetingType?: Meeting['meetingType'] }) {
  const isRecorded = meetingType === 'RECORDED';
  const title = isRecorded ? 'Recorded meeting' : 'Live meeting';
  const icon = isRecorded ? '🎵' : '📹';
  return (
    <span title={title} aria-label={title} style={{ fontSize: '1.1rem', lineHeight: 1 }}>
      {icon}
    </span>
  );
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const isProcessingRecorded =
    meeting.meetingType === 'RECORDED' && meeting.status === 'IN_PROGRESS';

  const handleClick = () => {
    if (isProcessingRecorded) return;
    onClick(meeting);
  };

  return (
    <button
      type="button"
      className="card-clickable"
      onClick={handleClick}
      disabled={isProcessingRecorded}
      title={isProcessingRecorded ? 'İşleniyor, lütfen bekleyin' : undefined}
      style={{
        position: 'relative',
        cursor: isProcessingRecorded ? 'not-allowed' : 'pointer',
        opacity: isProcessingRecorded ? 0.85 : 1,
      }}
    >
      {isProcessingRecorded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            borderRadius: 'inherit',
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
            aria-label="Processing"
          />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <MeetingTypeIcon meetingType={meeting.meetingType} />
          <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{meeting.title}</h3>
        </div>
        <StatusBadge status={meeting.status} />
      </div>
      {meeting.agenda && (
        <p style={{ marginTop: '6px', fontSize: 'var(--text-sm)' }}>{meeting.agenda}</p>
      )}
    </button>
  );
}
