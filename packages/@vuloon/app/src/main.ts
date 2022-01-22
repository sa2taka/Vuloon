import { app, BrowserWindow } from 'electron';

const index = `${__dirname}/index.html`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile(index);
}

app.whenReady().then(createWindow);
