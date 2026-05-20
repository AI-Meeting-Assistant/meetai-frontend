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
  exportPdf: (options?: { suggestedName?: string }) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    meetai?: MeetaiDesktopApi;
  }
}

export {};
