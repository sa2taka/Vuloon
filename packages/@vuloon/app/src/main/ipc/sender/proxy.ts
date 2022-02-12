import { ON_RESPONSE } from '@/ipc/mainToRendererKeys';
import { ResponseListener } from '@vuloon/proxy';
import { webContents } from 'electron';

export const sendResponse = (...args: Parameters<ResponseListener>): void => {
  webContents.getAllWebContents().forEach((webContent) => webContent.send(ON_RESPONSE, ...args));
};
