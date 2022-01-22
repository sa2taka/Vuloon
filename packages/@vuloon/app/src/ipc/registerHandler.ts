import { readConfigHandler } from './handlers/readConfig';
import { writeConfigHandler } from './handlers/writeConfig';

export const registerHandler = (): void => {
  readConfigHandler();
  writeConfigHandler();
};
