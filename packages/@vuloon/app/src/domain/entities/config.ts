import { themeKeys } from '@/domain/entities/theme';

export interface Config {
  initial: boolean;
  caDir: string;
  proxyPort: number;
  theme: typeof themeKeys[number];
}

export const defaultConfig = {
  initial: true,
  caDir: '',
  proxyPort: 5110,
  theme: 'light',
} as const;
