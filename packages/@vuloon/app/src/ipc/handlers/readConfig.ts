import { ipcMain } from 'electron';
import { readConfigFile } from '../../domain/repositories/config/persistance';
import { READ_CONFIG } from '../eventNames';

export const readConfigHandler = () =>
  ipcMain.handle(READ_CONFIG, () => {
    return readConfigFile();
  });
