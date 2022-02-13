import { getProxy } from '@/main/domain/models/proxy';
import { sendResponse } from '@/main/ipc/sender/proxy';
import { responseListenerMapper, requestListenerMapper } from './proxyParameterMapper';

const proxy = getProxy();

export const registerResponseListener = (): void => {
  proxy.addResponseListener('@vuloon/main', 'responseListener', (id, response, request) => {
    sendResponse(id, responseListenerMapper(response), requestListenerMapper(request));
  });
};
