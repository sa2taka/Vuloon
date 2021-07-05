import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { configFilePath } from '../configs/filePahts';
import { INITIALIZE } from './ipcEventNames';

export const registerHandler = () => {
  ipcMain.handle(INITIALIZE, () => {
    try {
      const file = readFileSync(configFilePath);
      return;
    } catch (e) {
      return;
    }
  });
};
