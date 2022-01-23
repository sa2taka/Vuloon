import { ipcMain } from 'electron';
import { Config } from '@/main/domain/entities/config';
import { READ_CONFIG, WRITE_CONFIG } from '../eventNames';
import { getConfig, setConfig } from '../../main/domain/repositories/config/index';

export const configHandler = () => {
  ipcMain.handle(READ_CONFIG, () => {
    return getConfig();
  });

  ipcMain.handle(WRITE_CONFIG, (_, newConfig: Config) => {
    return setConfig(newConfig);
  });
};
