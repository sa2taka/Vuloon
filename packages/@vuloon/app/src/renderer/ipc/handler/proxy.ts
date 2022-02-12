import { ResponseListener as ProxyResponseListener } from '@vuloon/proxy';
import { ipcRenderer } from 'electron';
import { ON_RESPONSE } from '@/ipc/mainToRendererKeys';

export const registerResponseHandler = (listener: ProxyResponseListener): void => {
  ipcRenderer.on(ON_RESPONSE, (_event, id, responseData, requestData) => listener(id, responseData, requestData));
};
