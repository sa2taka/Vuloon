import { configHandler } from './handlers/config';
import { proxyHandler } from './handlers/proxy';

export const registerHandler = (): void => {
  configHandler();
  proxyHandler();
};
