export const startProxy = (): void => window.electronApi.startProxy();
export const stopProxy = (): void => window.electronApi.stopProxy();
export const setCertificate = (): Promise<void> => window.electronApi.setCertificate();
