import { ExchangerEventBase } from '@/renderer/domain/exchanger/exchangerEventBase';
import { registerResponseHandler } from '@/renderer/ipc/handler/proxy';
import { onResponseParameter } from '@/@types/rendererToMainTypes';

export type ProxyExchange = {
  proxyIssuedId: onResponseParameter[0];
  response: onResponseParameter[1];
  request: onResponseParameter[2];
};

class RequestExchanger extends ExchangerEventBase<ProxyExchange> {
  protected key = '@vuloon:request';
  #store: ProxyExchange[] = [];
  #isListening = false;

  get store(): ProxyExchange[] {
    return this.#store;
  }

  listen(): void {
    if (!this.#isListening) {
      this.#isListening = true;
      registerResponseHandler(this.#responseListener.bind(this));
    }
  }

  #responseListener: (...args: onResponseParameter) => void = (proxyIssuedId, response, request) => {
    const data = {
      proxyIssuedId,
      response,
      request,
    };
    this.#store.unshift(data);
    this.send(new CustomEvent(this.key, { detail: data }));
  };
}

const requestExchanger = new RequestExchanger();
requestExchanger.listen();

export { requestExchanger };
