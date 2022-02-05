import { configHandler } from './handlers/config';
import { proxyHandler } from './handlers/proxy';
import { windowHandler } from './handlers/window';

export const registerHandler = (): void => {
  configHandler();
  proxyHandler();
  windowHandler();
};
