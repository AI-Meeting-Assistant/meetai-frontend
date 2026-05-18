import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopAlertPayload } from './notificationManager';

contextBridge.exposeInMainWorld('meetai', {
  notifications: {
    isSupported: (): Promise<boolean> => ipcRenderer.invoke('notifications:is-supported'),
    handleAlert: (payload: DesktopAlertPayload): Promise<void> =>
      ipcRenderer.invoke('notifications:handle-alert', payload),
    clearAll: (): Promise<void> => ipcRenderer.invoke('notifications:clear-all'),
  },
});
