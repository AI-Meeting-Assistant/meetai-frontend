let alertsSource: EventSource | null = null;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export function connectAlertsStream(meetingId: string, token: string): EventSource {
  disconnectAlertsStream();
  alertsSource = new EventSource(`${API_BASE_URL}/meetings/${meetingId}/events?token=${encodeURIComponent(token)}`);
  return alertsSource;
}

export function disconnectAlertsStream(): void {
  if (alertsSource) {
    alertsSource.close();
    alertsSource = null;
  }
}

export function onAlert(callback: (rawMessage: string) => void): void {
  if (!alertsSource) {
    return;
  }

  alertsSource.onmessage = (event) => callback(event.data);
}
