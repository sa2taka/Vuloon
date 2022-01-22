import { app } from 'electron';
import { resolve } from 'path';

export const configFilePath = resolve(app.getPath('userData'), 'config.json');
