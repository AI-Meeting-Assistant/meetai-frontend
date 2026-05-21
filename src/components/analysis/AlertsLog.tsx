import type { MeetingAlert } from '../../types';

function severityStyle(severity: string): { bg: string; border: string } {
  switch (severity.toUpperCase()) {
    case 'HIGH':   return { bg: 'var(--red-bg)',   border: 'var(--red)' };
    case 'MEDIUM': return { bg: 'var(--amber-bg)', border: 'var(--amber)' };
    default:       return { bg: 'var(--bg-subtle)', border: 'var(--tx-3)' };
  }
}

export function AlertsLog({ alerts }: { alerts: MeetingAlert[] }) {
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
            const s = severityStyle(alert.severity);
            return (
              <div key={alert.id} style={{
                padding: '10px 12px', background: s.bg,
                border: `1px solid ${s.border}`, borderLeftWidth: 3,
                borderRadius: 'var(--r-md)', animation: 'fadeSlideIn 0.2s ease',
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-1)', marginBottom: 2 }}>
                  {alert.eventType}
                </div>
                {alert.message && (
                  <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 2 }}>{alert.message}</div>
                )}
                <div style={{ fontSize: 10, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
                  {alert.severity} · {new Date(alert.createdAt).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
