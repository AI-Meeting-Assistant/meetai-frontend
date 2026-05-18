import { app, BrowserWindow, desktopCapturer, ipcMain, session } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
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
