export { useConfig } from '../../../renderer/recoil/config';
import { app } from 'electron';
import { resolve } from 'path';

export const defaultConfigFilePath = resolve(app.getPath('userData'), 'config.json');
