import { Proxy } from '@vuloon/proxy';
import { getConfig } from '../repositories/config/index';
import { resolve } from 'path';
import { app } from 'electron';

let proxy: Proxy | undefined;

export const getProxy = (): Proxy => {
  if (proxy) {
    return proxy;
  }

  const config = getConfig();
  const caDir = resolve(app.getPath('userData'), 'cert');

  proxy = new Proxy({
    port: config.proxyPort,
    ssl: {
      caDir,
    },
  });
  return proxy;
};
