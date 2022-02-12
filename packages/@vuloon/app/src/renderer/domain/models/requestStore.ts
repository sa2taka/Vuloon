import { registerResponseHandler } from '@/renderer/ipc/handler/proxy';
import { ResponseListener as ProxyResponseListener, RequestData, ResponseData } from '@vuloon/proxy';

type ResponseListener = ProxyResponseListener;

export type ProxyExchange = {
  proxyIssuedId: Parameters<ProxyResponseListener>[0];
  response: Parameters<ProxyResponseListener>[1];
  request: Parameters<ProxyResponseListener>[2];
};

class RequestStore {
  #store: ProxyExchange[] = [];
  #isRegister = false;

  resister(): void {
    if (!this.#isRegister) {
      this.#isRegister = true;
      registerResponseHandler(this.#responseListener.bind(this));
    }
  }

  #responseListener: ResponseListener = (proxyIssuedId, response, request) => {
    this.#store.unshift({
      proxyIssuedId,
      response,
      request,
    });
  };
}

const requestStore = new RequestStore();
requestStore.resister();

export { requestStore };
