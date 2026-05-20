import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, session } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { notificationManager, type DesktopAlertPayload } from './notificationManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let mainWindow: BrowserWindow | null = null;

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
    async (_event, options?: { suggestedName?: string }) => {
      const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
      if (!win) {
        return { success: false, error: 'No active window' };
      }

      try {
        const pdfBuffer = await win.webContents.printToPDF({
          landscape: true,
          printBackground: true,
          margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
        });

        const defaultName = options?.suggestedName
          ? `${options.suggestedName.replace(/[<>:"/\\|?*]/g, '_')}.pdf`
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
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

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
