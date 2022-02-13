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

  ipcRenderer: {
    on: <T extends any[]>(channel: string, callback: (event: Event, ...args: T) => void) =>
      ipcRenderer.on(channel, callback as (event: Event, ...args: any[]) => void),
    once: <T extends any[]>(channel: string, callback: (event: Event, ...args: T) => void) =>
      ipcRenderer.once(channel, callback as (event: Event, ...args: any[]) => void),
    removeListener: (channel: string, listener: (...args: any[]) => void) =>
      ipcRenderer.removeListener(channel, listener),
  },
};

export type ElectronApi = typeof apis;

contextBridge.exposeInMainWorld('electronApi', apis);
