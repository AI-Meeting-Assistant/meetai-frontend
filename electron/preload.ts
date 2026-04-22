import { contextBridge } from 'electron';

// MVP preload bridge intentionally minimal.
contextBridge.exposeInMainWorld('meetai', {});
