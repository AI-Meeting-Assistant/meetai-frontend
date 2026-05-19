import type { LiveAlert } from '../../types';

const ALERT_LABELS: Record<LiveAlert['type'], string> = {
  FOCUS_DROP:              'Focus dropped below threshold',
  FOCUS_RECOVERED:         'Focus recovered',
  SPEAKING_RATE_DROP:      'Speaking rate dropped below threshold',
  SPEAKING_RATE_RECOVERED: 'Speaking rate recovered',
  AGENDA_DEVIATION:        'Meeting is deviating from the agenda',
  AGENDA_FIT:              'Meeting is on track with the agenda',
};

function formatDetail(alert: LiveAlert): string {
  if (alert.avg !== undefined) return `avg: ${(alert.avg * 100).toFixed(1)}%`;
  if (alert.contextFit !== undefined) return `context fit: ${(alert.contextFit * 100).toFixed(0)}%`;
  return '';
}

export function AlertFeed({ alerts }: { alerts: LiveAlert[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h4>Live Alerts</h4>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {alerts.length} event{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>
      {alerts.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>No alerts yet.</p>
      ) : (
        alerts.map((alert) => (
          <article key={`${alert.type}-${alert.offsetMs}`} className="alert-item">
            <div className="alert-item-label">{ALERT_LABELS[alert.type]}</div>
            <div className="alert-item-message">{formatDetail(alert)}</div>
          </article>
        ))
      )}
    </section>
  );
}
