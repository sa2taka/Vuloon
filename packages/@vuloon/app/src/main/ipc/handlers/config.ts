import { ipcMain } from 'electron';
import { Config } from '@/domain/entities/config';
import { READ_CONFIG, WRITE_CONFIG } from '../sendKeys';
import { getConfig, setConfig } from '../../domain/repositories/config/index';

export const configHandler = (): void => {
  ipcMain.handle(READ_CONFIG, () => {
    return getConfig();
  });

  ipcMain.on(WRITE_CONFIG, (_, newConfig: Config) => {
    return setConfig(newConfig);
  });
};