export interface DesktopAlertPayload {
  type: string;
  title: string;
  body: string;
}

export interface MeetaiDesktopApi {
  notifications: {
    isSupported: () => Promise<boolean>;
    handleAlert: (payload: DesktopAlertPayload) => Promise<void>;
    clearAll: () => Promise<void>;
  };
}

declare global {
  interface Window {
    meetai?: MeetaiDesktopApi;
  }
}

export {};
