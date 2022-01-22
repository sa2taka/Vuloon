import { ipcMain } from 'electron';
import { Config } from '@/domain/entities/config';
import { writeConfigFile } from '@/domain/repositories/config/persistance';
import { WRITE_CONFIG } from '../eventNames';

export const writeConfigHandler = () =>
  ipcMain.handle(WRITE_CONFIG, (_, newConfig: Config) => {
    return writeConfigFile(newConfig);
  });
