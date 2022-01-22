import { ipcMain } from 'electron';
import { Config } from '@/domain/repositories/config';
import { readConfigFile, writeConfigFile } from '@/domain/repositories/config/persistance';
import { READ_CONFIG, WRITE_CONFIG } from '../eventNames';

export const writeConfigHandler = () =>
  ipcMain.handle(WRITE_CONFIG, (_, newConfig: Config) => {
    return writeConfigFile(newConfig);
  });
