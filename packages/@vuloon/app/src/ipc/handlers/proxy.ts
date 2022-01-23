import { proxy } from '@/main/domain/models/proxy';
import { ipcMain } from 'electron';
import { START_PROXY, STOP_PROXY, GET_PROXY } from '../sendKeys';
import { setProxy, enableProxy, disableProxy } from '@vuloon/proxy-setter';

export const proxyHandler = (): void => {
  ipcMain.on(START_PROXY, async () => {
    proxy.start();
    try {
      await setProxy(proxy.port);
      await enableProxy();
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.on(STOP_PROXY, async () => {
    proxy.stop();
    try {
      await disableProxy();
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.handle(GET_PROXY, () => {
    return proxy;
  });
};
