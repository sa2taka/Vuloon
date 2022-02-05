import { ipcMain } from 'electron';
import { COMPLETE_INITIAL } from '../sendKeys';
import { windowManager } from '@/main/domain/models/windowManager';
import { getConfig, setConfig } from '@/main/domain/repositories/config';

export const windowHandler = (): void => {
  ipcMain.on(COMPLETE_INITIAL, async () => {
    windowManager.quitInitialPage();
    windowManager.openIndexPage();
    const config = getConfig();
    const newConfig = {
      ...config,
      initial: false,
    };
    setConfig(newConfig);
  });
};
