import { registerResponseListener } from '@/main/domain/models/proxyListeners';

let hasAlreadyInitialize = false;

export const initialize = () => {
  if (!hasAlreadyInitialize) {
    registerResponseListener();
    hasAlreadyInitialize = true;
  }
};
