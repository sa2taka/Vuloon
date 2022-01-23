export { useConfig } from '@/renderer/recoil/config';
import { app } from 'electron';
import { resolve } from 'path';
import { Config } from '@/main/domain/entities/config';
import { readConfigFile, writeConfigFile } from '@/main/domain/repositories/config/persistance';

export const defaultConfigFilePath = resolve(app.getPath('userData'), 'config.json');

let currentConfig: Config | null = null;

export const getConfig = (): Config => {
  if (currentConfig) {
    return currentConfig;
  }
  currentConfig = readConfigFile();
  return currentConfig;
};

export const setConfig = (newConfig: Config): void => {
  currentConfig = newConfig;
  writeConfigFile(newConfig);
};
