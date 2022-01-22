import { readConfigHandler } from './handlers/readConfig';
import { writeConfigHandler } from './handlers/writeConfig';

export const registerHandler = () => {
  readConfigHandler();
  writeConfigHandler();
};
