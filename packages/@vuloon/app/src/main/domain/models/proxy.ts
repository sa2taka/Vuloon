import { Proxy } from '@vuloon/proxy';
import { getConfig } from '../repositories/config/index';
import { resolve } from 'path';
import { app } from 'electron';

const config = getConfig();
const caDir = resolve(app.getPath('userData'), 'cert');

export const proxy = new Proxy({
  port: config.proxyPort,
  ssl: {
    caDir,
  },
});
