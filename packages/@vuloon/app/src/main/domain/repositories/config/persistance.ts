import { readFileSync, writeFileSync, existsSync } from 'fs';
import { defaultConfigFilePath } from '.';
import { Config, defaultConfig } from '@/domain/entities/config';

export const readConfigFile = (filePath: string = defaultConfigFilePath): Config => {
  if (!existsSync(filePath)) {
    writeConfigFile(defaultConfig, filePath);
    return defaultConfig;
  }

  try {
    const fileContent = readFileSync(filePath).toString();
    return JSON.parse(fileContent);
  } catch (e) {
    return defaultConfig;
  }
};

export const writeConfigFile = (config: Config, filePath: string = defaultConfigFilePath): void => {
  return writeFileSync(filePath, JSON.stringify(config));
};
