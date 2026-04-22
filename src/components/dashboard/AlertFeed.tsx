import type { MeetingAlert } from '../../types';

export function AlertFeed({ alerts }: { alerts: MeetingAlert[] }) {
  return (
    <section>
      <h4>Live Alerts</h4>
      {alerts.map((alert) => (
        <article key={alert.id}>
          <strong>{alert.eventType}</strong> - {alert.message}
        </article>
      ))}
    </section>
  );
}
