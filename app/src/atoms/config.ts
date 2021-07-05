import { atom } from 'recoil';

export interface Config {
  initial: boolean;
  caDir: string;
  proxyPort: number;
}

export const configState = atom<Config>({
  key: 'config',
  default: {
    initial: true,
    caDir: '',
    proxyPort: 5110,
  },
});
