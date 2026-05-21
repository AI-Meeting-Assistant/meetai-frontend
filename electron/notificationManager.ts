import { Notification } from 'electron';

export type DesktopAlertKind = 'focus' | 'speaking' | 'agenda';

export interface DesktopAlertPayload {
  type: string;
  title: string;
  body: string;
}

const RECOVERY_AUTO_CLOSE_MS = 5000;

class NotificationManager {
  private readonly dropNotifications = new Map<DesktopAlertKind, Notification>();
  private readonly recoveryTimers = new Map<DesktopAlertKind, ReturnType<typeof setTimeout>>();

  isSupported(): boolean {
    return Notification.isSupported();
  }

  handleAlert(payload: DesktopAlertPayload): void {
    if (!Notification.isSupported()) {
      return;
    }

    switch (payload.type) {
      case 'FOCUS_DROP':
        this.showDrop('focus', payload.title, payload.body);
        break;
      case 'FOCUS_RECOVERED':
        this.showRecovery('focus', payload.title, payload.body);
        break;
      case 'SPEAKING_RATE_DROP':
        this.showDrop('speaking', payload.title, payload.body);
        break;
      case 'SPEAKING_RATE_RECOVERED':
        this.showRecovery('speaking', payload.title, payload.body);
        break;
      case 'AGENDA_DEVIATION':
        this.showDrop('agenda', payload.title, payload.body);
        break;
      case 'AGENDA_FIT':
        this.showRecovery('agenda', payload.title, payload.body);
        break;
      default:
        break;
    }
  }

  clearAll(): void {
    for (const kind of this.dropNotifications.keys()) {
      this.dropNotifications.get(kind)?.close();
    }
    this.dropNotifications.clear();
    for (const timer of this.recoveryTimers.values()) {
      clearTimeout(timer);
    }
    this.recoveryTimers.clear();
  }

  private showDrop(kind: DesktopAlertKind, title: string, body: string): void {
    this.clearRecoveryTimer(kind);
    this.dropNotifications.get(kind)?.close();

    const notification = new Notification({
      title,
      body,
      timeoutType: 'never',
    });
    notification.on('close', () => {
      if (this.dropNotifications.get(kind) === notification) {
        this.dropNotifications.delete(kind);
      }
    });
    this.dropNotifications.set(kind, notification);
    notification.show();
  }

  private showRecovery(kind: DesktopAlertKind, title: string, body: string): void {
    this.dropNotifications.get(kind)?.close();
    this.dropNotifications.delete(kind);
    this.clearRecoveryTimer(kind);

    const notification = new Notification({ title, body });
    notification.show();
    const timer = setTimeout(() => {
      notification.close();
      if (this.recoveryTimers.get(kind) === timer) {
        this.recoveryTimers.delete(kind);
      }
    }, RECOVERY_AUTO_CLOSE_MS);
    this.recoveryTimers.set(kind, timer);
  }

  private clearRecoveryTimer(kind: DesktopAlertKind): void {
    const timer = this.recoveryTimers.get(kind);
    if (timer) {
      clearTimeout(timer);
      this.recoveryTimers.delete(kind);
    }
  }
}

export const notificationManager = new NotificationManager();
