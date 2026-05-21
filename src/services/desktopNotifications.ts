import type { LiveAlert } from '../types';
import type { DesktopAlertPayload } from '../types/meetai-desktop';

const APP_TITLE = 'MeetAI';

function formatAvgPercent(avg: number | undefined): string {
  if (avg === undefined) {
    return '';
  }
  return ` (${(avg * 100).toFixed(1)}%)`;
}

function buildPayload(alert: LiveAlert, meetingTitle?: string): DesktopAlertPayload | null {
  const prefix = meetingTitle ? `${meetingTitle} — ` : '';

  switch (alert.type) {
    case 'FOCUS_DROP':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Focus dropped`,
        body: `${prefix}Average focus fell below threshold${formatAvgPercent(alert.avg)}.`,
      };
    case 'FOCUS_RECOVERED':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Focus recovered`,
        body: `${prefix}Focus is back above threshold${formatAvgPercent(alert.avg)}.`,
      };
    case 'SPEAKING_RATE_DROP':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Speaking rate dropped`,
        body: `${prefix}Speaking activity fell below threshold${formatAvgPercent(alert.avg)}.`,
      };
    case 'SPEAKING_RATE_RECOVERED':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Speaking rate recovered`,
        body: `${prefix}Speaking activity is back above threshold${formatAvgPercent(alert.avg)}.`,
      };
    case 'AGENDA_DEVIATION':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Off agenda`,
        body: `${prefix}Discussion in the last ~30 seconds appears off agenda${
          alert.contextFit !== undefined
            ? ` (${(alert.contextFit * 100).toFixed(0)}% context fit)`
            : ''
        }.`,
      };
    case 'AGENDA_FIT':
      return {
        type: alert.type,
        title: `${APP_TITLE}: Back on agenda`,
        body: `${prefix}Discussion is on topic again${
          alert.contextFit !== undefined
            ? ` (${(alert.contextFit * 100).toFixed(0)}% context fit)`
            : ''
        }.`,
      };
    default:
      return null;
  }
}

export function isDesktopNotificationSupported(): boolean {
  return Boolean(window.meetai?.notifications);
}

export async function clearDesktopNotifications(): Promise<void> {
  await window.meetai?.notifications?.clearAll();
}

export async function showDesktopNotificationForAlert(
  alert: LiveAlert,
  meetingTitle?: string,
): Promise<void> {
  const api = window.meetai?.notifications;
  if (!api) {
    return;
  }

  const payload = buildPayload(alert, meetingTitle);
  if (!payload) {
    return;
  }

  try {
    const supported = await api.isSupported();
    if (!supported) {
      return;
    }
    await api.handleAlert(payload);
  } catch (error) {
    console.warn('[desktopNotifications] Failed to show notification:', error);
  }
}
