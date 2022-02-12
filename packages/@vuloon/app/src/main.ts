import { getProxy } from '@/main/domain/models/proxy';
import { app } from 'electron';
import { disableProxy } from '@vuloon/proxy-setter';
import { getConfig } from './main/domain/repositories/config/index';
import { registerHandler } from '@/main/ipc/registerHandler';
import { windowManager } from '@/main/domain/models/windowManager';
import { initialize } from '@/main/initialize';

function createWindow() {
  registerHandler();

  const config = getConfig();

  if (config.initial) {
    windowManager.openInitialPage();
  } else {
    windowManager.openIndexPage();
  }
}

app.whenReady().then(createWindow).then(initialize);
app.on('window-all-closed', app.quit);
app.on('before-quit', async () => {
  const proxy = getProxy();
  proxy.stop();
  await disableProxy();
});
