import { app, BrowserWindow } from 'electron';
import { registerHandler } from './ipc/ipcMainHandler';

process.env.NODE_OPTIONS = undefined;

const index = `${__dirname}/index.html`;

registerHandler();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: false,
      contextIsolation: false,
    },
  });

  win.loadFile(index);
}

app.whenReady().then(createWindow);
