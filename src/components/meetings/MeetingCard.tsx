import { useState } from 'react';
import type { Meeting } from '../../types';
import { StatusBadge } from './StatusBadge';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: (meeting: Meeting) => void;
}

function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(startedAt?: string | null, endedAt?: string | null) {
  if (!startedAt || !endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return null;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min} min`;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const [hov, setHov] = useState(false);

  const isProcessingRecorded =
    meeting.meetingType === 'RECORDED' && meeting.status === 'IN_PROGRESS';

  const typeLabel = meeting.meetingType === 'RECORDED' ? 'REC' : 'LIVE';
  const typeColor = meeting.meetingType === 'RECORDED' ? 'var(--tx-3)' : 'var(--accent)';

  const date = formatDate(meeting.startedAt ?? meeting.createdAt);
  const duration = formatDuration(meeting.startedAt, meeting.endedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(meeting)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(meeting)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={isProcessingRecorded ? 'Processing — click to view progress' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 20px',
        background: 'var(--bg-card)',
        border: `1px solid ${hov ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        boxShadow: hov ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hov ? 'translateY(-1px)' : 'none',
        transition: 'border-color 0.12s, box-shadow 0.12s, transform 0.12s',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        opacity: isProcessingRecorded ? 0.85 : 1,
      }}
    >
      {/* Processing overlay */}
      {isProcessingRecorded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'oklch(0 0 0 / 0.25)',
          borderRadius: 'inherit', zIndex: 1,
        }}>
          <span style={{
            width: 24, height: 24,
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            display: 'block',
          }} aria-label="Processing" />
        </div>
      )}

      {/* Type label */}
      <span style={{
        fontSize: 10, fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
        flexShrink: 0,
        color: typeColor,
      }}>
        {typeLabel}
      </span>

      {/* Title + agenda */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--tx-1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {meeting.title}
        </div>
        {meeting.agenda && (
          <div style={{
            fontSize: 12, color: 'var(--tx-3)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {meeting.agenda}
          </div>
        )}
      </div>

      {/* Date + duration */}
      {(date || duration) && (
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
          {date && <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{date}</div>}
          {duration && (
            <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
              {duration}
            </div>
          )}
        </div>
      )}

      {/* Status badge */}
      <StatusBadge status={meeting.status} />

      {/* Chevron */}
      <span style={{ color: 'var(--tx-3)', flexShrink: 0 }}>
        <ChevronRight />
      </span>
    </div>
  );
}
