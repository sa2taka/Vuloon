export { useConfig } from './hook';
import { app } from 'electron';
import { resolve } from 'path';

export interface Config {
  initial: boolean;
  caDir: string;
  proxyPort: number;
}

export const defaultConfig = {
  initial: true,
  caDir: '',
  proxyPort: 5110,
};

export const defaultConfigFilePath = resolve(app.getPath('userData'), 'config.json');
