import { BrowserWindow } from 'electron';
import path from 'path';

const index = `${__dirname}/index.html`;
const initialSetting = `${__dirname}/initial-setting.html`;

class WindowManger {
  #windows: Record<string, BrowserWindow | null> = {};

  openIndexPage() {
    const win = this.#createWindow();
    win.loadFile(index);
    this.#windows['index'] = win;
    win.on('close', () => {
      this.#windows['index'] = null;
    });
  }

  quitIndexPage() {
    this.#windows['index']?.close();
  }

  openInitialPage() {
    const win = this.#createWindow();
    win.loadFile(initialSetting);
    this.#windows['initial'] = win;
    win.on('close', () => {
      this.#windows['initial'] = null;
    });
  }

  quitInitialPage() {
    this.#windows['initial']?.close();
  }

  #createWindow(options: Omit<Partial<ConstructorParameters<typeof BrowserWindow>[0]>, 'webPreferences'> = {}) {
    const win = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      ...options,
    });

    return win;
  }
}

const windowManager = new WindowManger();

export { windowManager };
