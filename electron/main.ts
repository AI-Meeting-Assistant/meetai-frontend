import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, session, nativeTheme } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { notificationManager, type DesktopAlertPayload } from './notificationManager';
import { generatePdf, type PdfReportData } from './pdfGenerator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let mainWindow: BrowserWindow | null = null;

function registerThemeIpc(): void {
  ipcMain.handle('theme:set', (_event, theme: 'light' | 'dark') => {
    nativeTheme.themeSource = theme;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#2E2E2E' : '#ffffff';

    mainWindow?.setBackgroundColor(bgColor);
  });
}

function registerNotificationIpc(): void {
  ipcMain.handle('notifications:is-supported', () => notificationManager.isSupported());

  ipcMain.handle('notifications:handle-alert', (_event, payload: DesktopAlertPayload) => {
    notificationManager.handleAlert(payload);
  });

  ipcMain.handle('notifications:clear-all', () => {
    notificationManager.clearAll();
  });
}

function registerExportIpc(): void {
  ipcMain.handle(
    'export:print-to-pdf',
    async (_event, payload?: { suggestedName?: string; reportData?: PdfReportData }) => {
      const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
      if (!win) {
        return { success: false, error: 'No active window' };
      }

      if (!payload?.reportData) {
        return { success: false, error: 'No report data provided' };
      }

      try {
        const pdfBuffer = await generatePdf(payload.reportData);

        const defaultName = payload.suggestedName
          ? `${payload.suggestedName.replace(/[<>:"/\\|?*]/g, '_')}.pdf`
          : 'MeetAI_Report.pdf';

        const { canceled, filePath } = await dialog.showSaveDialog(win, {
          title: 'Export Analysis as PDF',
          defaultPath: defaultName,
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
        });

        if (canceled || !filePath) {
          return { success: false, error: 'cancelled' };
        }

        await fs.promises.writeFile(filePath, pdfBuffer);
        return { success: true, filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    },
  );
}

function createWindow() {
  const isDark = nativeTheme.shouldUseDarkColors;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: isDark ? '#2E2E2E' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Hide the native menu bar (Alt will still show it on Windows if not careful)
  mainWindow.setMenuBarVisibility(false);

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ['media', 'audioCapture', 'display-capture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      const screenSource = sources.find((s) => s.id.startsWith('screen:')) || sources[0];
      callback({ video: screenSource, audio: 'loopback' });
    });
  });

  if (VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    void mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.meetai.desktop');
}

registerThemeIpc();
registerNotificationIpc();
registerExportIpc();

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  notificationManager.clearAll();
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
  }
});
