import { proxy } from '@/main/domain/models/proxy';
import { ipcMain } from 'electron';
import { START_PROXY, STOP_PROXY, GET_PROXY } from '../eventNames';

export const proxyHandler = (): void => {
  ipcMain.handle(START_PROXY, () => {
    proxy.start();
  });

  ipcMain.handle(STOP_PROXY, () => {
    proxy.stop();
  });

  ipcMain.handle(GET_PROXY, () => {
    return proxy;
  });
};
