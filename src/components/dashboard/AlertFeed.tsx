import type { LiveAlert } from '../../types';

const ALERT_LABELS: Record<LiveAlert['type'], string> = {
  FOCUS_DROP:              'Focus dropped below threshold',
  FOCUS_RECOVERED:         'Focus recovered',
  SPEAKING_RATE_DROP:      'Speaking rate dropped below threshold',
  SPEAKING_RATE_RECOVERED: 'Speaking rate recovered',
  AGENDA_DEVIATION:        'Meeting is deviating from the agenda',
  AGENDA_FIT:              'Meeting is on track with the agenda',
};

function severityOf(type: LiveAlert['type']): 'warning' | 'info' {
  return type.endsWith('_DROP') || type === 'AGENDA_DEVIATION' ? 'warning' : 'info';
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
            background: 'var(--amber-bg)', color: 'var(--amber)',
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
            const isWarning = severityOf(alert.type) === 'warning';
            const detail = formatDetail(alert);
            return (
              <div key={`${alert.type}-${alert.offsetMs}`} style={{
                padding: '9px 11px',
                background: isWarning ? 'var(--amber-bg)' : 'var(--accent-subtle)',
                border: `1px solid ${isWarning ? 'var(--amber)' : 'var(--accent-border)'}`,
                borderLeftWidth: 3,
                borderRadius: 'var(--r-md)',
                animation: 'fadeSlideIn 0.2s ease',
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-1)', marginBottom: 2 }}>
                  {ALERT_LABELS[alert.type]}
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
