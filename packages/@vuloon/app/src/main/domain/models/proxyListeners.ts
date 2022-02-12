import { getProxy } from '@/main/domain/models/proxy';
import { sendResponse } from '@/main/ipc/sender/proxy';

const proxy = getProxy();

export const registerResponseListener = (): void => {
  proxy.addResponseListener('@vuloon/main', 'responseListener', sendResponse);
};
