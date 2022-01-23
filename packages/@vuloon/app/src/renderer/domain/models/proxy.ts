import { GET_PROXY, START_PROXY, STOP_PROXY } from '@/ipc/eventNames';
import { Proxy } from '@vuloon/proxy';
import { ipcRenderer } from 'electron';

export const getProxy = (): Promise<Proxy> => ipcRenderer.invoke(GET_PROXY);
export const startProxy = (): Promise<void> => ipcRenderer.invoke(START_PROXY);
export const stopProxy = (): Promise<void> => ipcRenderer.invoke(STOP_PROXY);
