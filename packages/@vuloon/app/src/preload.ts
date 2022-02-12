import { contextBridge, ipcRenderer } from 'electron';
import * as Keys from '@/ipc/rendererToMainKeys';
import { Config } from '@/domain/entities/config';

const apis = {
  [Keys.READ_CONFIG]: (): Promise<Config> => ipcRenderer.invoke(Keys.READ_CONFIG),
  [Keys.WRITE_CONFIG]: (newConfig: Config) => ipcRenderer.send(Keys.WRITE_CONFIG, newConfig),

  [Keys.START_PROXY]: () => ipcRenderer.send(Keys.START_PROXY),
  [Keys.STOP_PROXY]: () => ipcRenderer.send(Keys.STOP_PROXY),
  [Keys.SET_CERTIFICATE]: () => ipcRenderer.invoke(Keys.SET_CERTIFICATE),

  [Keys.COMPLETE_INITIAL]: () => ipcRenderer.send(Keys.COMPLETE_INITIAL),
};

export type ElectronApi = typeof apis;

contextBridge.exposeInMainWorld('electronApi', apis);
