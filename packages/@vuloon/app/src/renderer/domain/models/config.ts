import { Config } from '@/domain/entities/config';

export const getConfig = (): Promise<Config> => window.electronApi.readConfig();
export const setConfig = (newConfig: Config): void => window.electronApi.writeConfig(newConfig);
