import { onResponseParameter } from '@/@types/rendererToMainTypes';
import { ON_RESPONSE } from '@/ipc/mainToRendererKeys';
import { webContents } from 'electron';

export const sendResponse = (...args: onResponseParameter): void => {
  webContents.getAllWebContents().forEach((webContent) => {
    webContent.send(ON_RESPONSE, ...args);
  });
};
