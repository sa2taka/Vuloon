import { Proxy } from '@vuloon/proxy';

export const getProxy = (): Promise<Proxy> => window.electronApi.getProxy();
export const startProxy = (): void => window.electronApi.startProxy();
export const stopProxy = (): void => window.electronApi.stopProxy();
export const setCertificate = (): void => window.electronApi.setCertificate();
