import type { MeetingAlert } from '../../types';

export function AlertsLog({ alerts }: { alerts: MeetingAlert[] }) {
  return (
    <section>
      <h3>Alerts Log</h3>
      {alerts.map((alert) => (
        <div key={alert.id}>
          {alert.severity} | {alert.eventType} | {alert.createdAt}
        </div>
      ))}
    </section>
  );
}
