import type { MeetingAlert } from '../../types';

function severityClass(severity: string) {
  switch (severity.toUpperCase()) {
    case 'HIGH':   return 'alert-item alert-item-high';
    case 'MEDIUM': return 'alert-item alert-item-medium';
    default:       return 'alert-item alert-item-low';
  }
}

export function AlertsLog({ alerts }: { alerts: MeetingAlert[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Alerts Log</h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {alerts.length} total
        </span>
      </div>
      {alerts.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>No alerts recorded.</p>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className={severityClass(alert.severity)}>
            <div className="alert-item-label">{alert.eventType}</div>
            <div className="alert-item-meta">
              {alert.severity} · {new Date(alert.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
