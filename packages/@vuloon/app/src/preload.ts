import { contextBridge, ipcRenderer } from 'electron';
import * as Keys from '@/ipc/sendKeys';
import { Proxy } from '@vuloon/proxy';
import { Config } from '@/main/domain/entities/config';

const apis = {
  [Keys.READ_CONFIG]: (): Promise<Config> => ipcRenderer.invoke(Keys.READ_CONFIG),
  [Keys.WRITE_CONFIG]: (newConfig: Config) => ipcRenderer.send(Keys.WRITE_CONFIG, newConfig),

  [Keys.GET_PROXY]: (): Promise<Proxy> => ipcRenderer.invoke(Keys.GET_PROXY),
  [Keys.START_PROXY]: () => ipcRenderer.send(Keys.START_PROXY),
  [Keys.STOP_PROXY]: () => ipcRenderer.send(Keys.STOP_PROXY),
};

export type ElectronApi = typeof apis;

contextBridge.exposeInMainWorld('electronApi', apis);
