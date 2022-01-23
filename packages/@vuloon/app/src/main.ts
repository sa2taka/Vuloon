import { proxy } from '@/main/domain/models/proxy';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';

const index = `${__dirname}/index.html`;

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

  win.loadFile(index);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', app.quit);
app.on('before-quit', () => {
  proxy.stop();
});
