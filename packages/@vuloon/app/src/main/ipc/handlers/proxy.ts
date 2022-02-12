import { getProxy } from '@/main/domain/models/proxy';
import { ipcMain } from 'electron';
import { START_PROXY, STOP_PROXY, SET_CERTIFICATE } from '../sendKeys';
import { setProxy, enableProxy, disableProxy } from '@vuloon/proxy-setter';
import { addCert } from '@vuloon/root-certificate-supplier';

export const proxyHandler = (): void => {
  ipcMain.on(START_PROXY, async () => {
    const proxy = getProxy();
    proxy.start();
    try {
      await setProxy(proxy.port);
      await enableProxy();
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.on(STOP_PROXY, async () => {
    const proxy = getProxy();
    proxy.stop();
    try {
      await disableProxy();
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.handle(SET_CERTIFICATE, async () => {
    const proxy = getProxy();
    const filePath = proxy.rootCertPath;

    await addCert(filePath);
  });
};
