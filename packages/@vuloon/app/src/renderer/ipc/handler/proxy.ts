import { ResponseListener as ProxyResponseListener } from '@vuloon/proxy';
import { ON_RESPONSE } from '@/ipc/mainToRendererKeys';
import { onResponseParameter } from '@/@types/rendererToMainTypes';
import { responseListenerMapper, requestListenerMapper } from '@/main/domain/models/proxyParameterMapper';

export const registerResponseHandler = (listener: (...args: onResponseParameter) => void): (() => void) => {
  const eventListener = (...[, id, responseData, requestData]: [Event, ...Parameters<ProxyResponseListener>]) =>
    listener(id, responseListenerMapper(responseData), requestListenerMapper(requestData));

  window.electronApi.ipcRenderer.on(ON_RESPONSE, eventListener);

  return () => window.electronApi.ipcRenderer.removeListener(ON_RESPONSE, eventListener);
};
