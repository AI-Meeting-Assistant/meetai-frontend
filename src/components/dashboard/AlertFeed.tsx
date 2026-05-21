import type { LiveAlert } from '../../types';
import { colors, alertSeverityStyle } from '../common/colors';
import { eventTypeLabel } from '../common/alertLabels';

function severityOf(type: LiveAlert['type']): string {
  return type.endsWith('_DROP') || type === 'AGENDA_DEVIATION' ? 'HIGH' : 'LOW';
}

function formatDetail(alert: LiveAlert): string {
  if (alert.avg !== undefined) return `avg: ${(alert.avg * 100).toFixed(1)}%`;
  if (alert.contextFit !== undefined) return `context fit: ${(alert.contextFit * 100).toFixed(0)}%`;
  return '';
}

function formatOffset(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function AlertFeed({ alerts }: { alerts: LiveAlert[] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Alerts
        </div>
        {alerts.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: colors.amberBg, color: colors.amber,
            padding: '1px 6px', borderRadius: 'var(--r-sm)',
          }}>
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--tx-3)', fontStyle: 'italic', margin: 0 }}>No active alerts.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert) => {
            const severity = severityOf(alert.type);
            const s = alertSeverityStyle(severity);
            const detail = formatDetail(alert);
            return (
              <div key={`${alert.type}-${alert.offsetMs}`} style={{
                padding: '9px 11px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderLeftWidth: 4,
                borderRadius: 'var(--r-md)',
                animation: 'fadeSlideIn 0.2s ease',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.accent, letterSpacing: '0.04em', marginBottom: detail ? 4 : 0 }}>
                  {eventTypeLabel(alert.type)}
                </div>
                {detail && (
                  <div style={{ fontSize: 10, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
                    {detail} · {formatOffset(alert.offsetMs)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
