import { ipcMain } from 'electron';
import { COMPLETE_INITIAL } from '../sendKeys';
import { windowManager } from '@/main/domain/models/windowManager';

export const windowHandler = (): void => {
  ipcMain.on(COMPLETE_INITIAL, async () => {
    windowManager.quitInitialPage();
    windowManager.openIndexPage();
  });
};
