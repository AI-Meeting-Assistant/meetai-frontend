import type { MeetingAlert } from '../../types';

function severityClass(severity: string) {
  switch (severity.toUpperCase()) {
    case 'HIGH':   return 'alert-item alert-item-high';
    case 'MEDIUM': return 'alert-item alert-item-medium';
    default:       return 'alert-item alert-item-low';
  }
}

export function AlertFeed({ alerts }: { alerts: MeetingAlert[] }) {
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
          <article key={alert.id} className={severityClass(alert.severity)}>
            <div className="alert-item-label">{alert.eventType}</div>
            <div className="alert-item-message">{alert.message}</div>
          </article>
        ))
      )}
    </section>
  );
}
