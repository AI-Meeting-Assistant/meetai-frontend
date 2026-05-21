import type { MeetingAlert } from '../../types';
import { alertSeverityStyle } from '../common/colors';
import { eventTypeLabel } from '../common/alertLabels';

function formatMeetingOffset(createdAt: string, startedAt: string): string {
  const ms = new Date(createdAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface AlertsLogProps {
  alerts: MeetingAlert[];
  meetingStartedAt?: string | null;
}

export function AlertsLog({ alerts, meetingStartedAt }: AlertsLogProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>Alerts Log</span>
        <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          {alerts.length} total
        </span>
      </div>

      {alerts.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic', margin: 0 }}>
          No alerts were recorded in this session.
        </p>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert) => {
            const s = alertSeverityStyle(alert.severity);
            const time = meetingStartedAt
              ? formatMeetingOffset(alert.createdAt, meetingStartedAt)
              : new Date(alert.createdAt).toLocaleTimeString();

            return (
              <div key={alert.id} style={{
                padding: '10px 12px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderLeftWidth: 4,
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: s.accent,
                  letterSpacing: '0.04em', marginBottom: 4,
                }}>
                  {eventTypeLabel(alert.eventType)}
                </div>
                {alert.message && (
                  <div style={{ fontSize: 12, color: 'var(--tx-1)', marginBottom: 4, lineHeight: 1.5 }}>
                    {alert.message}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
                  {alert.severity} · {meetingStartedAt ? `${time} into meeting` : time}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
