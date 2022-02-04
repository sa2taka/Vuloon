import { getProxy } from '@/main/domain/models/proxy';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { disableProxy } from '@vuloon/proxy-setter';
import { getConfig } from './main/domain/repositories/config/index';
import { registerHandler } from '@/ipc/registerHandler';

const index = `${__dirname}/index.html`;
const initialSetting = `${__dirname}/initial-setting.html`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  registerHandler();

  const config = getConfig();

  if (config.initial) {
    win.loadFile(initialSetting);
  } else {
    win.loadFile(index);
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', app.quit);
app.on('before-quit', async () => {
  const proxy = getProxy();
  proxy.stop();
  await disableProxy();
});
