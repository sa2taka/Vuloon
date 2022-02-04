import { themeKeys } from '@/domain/entities/theme';
import { app } from 'electron';

export interface Config {
  initial: boolean;
  caDir: string;
  proxyPort: number;
  theme: typeof themeKeys[number];
  language: string;
}

export const getDefaultConfig = () =>
  ({
    initial: true,
    caDir: '',
    proxyPort: 5110,
    theme: 'light',
    language: app.getLocale(),
  } as const);
