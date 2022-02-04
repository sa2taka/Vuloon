export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

// ref: ../src/ipc/sendKeys.ts
const READ_CONFIG = 'readConfig';
const WRITE_CONFIG = 'writeConfig';

const GET_PROXY = 'getProxy';
const START_PROXY = 'startProxy';
const STOP_PROXY = 'stopProxy';
const SET_CERTIFICATE = 'setCertificate';

const defaultConfig = {
  initial: true,
  caDir: '',
  proxyPort: 5110,
  theme: 'light',
  language: 'en',
};

window.electronApi = {};
window.electronApi[READ_CONFIG] = () => {
  return defaultConfig;
};

window.electronApi[WRITE_CONFIG] = () => {};
window.electronApi[GET_PROXY] = () => {};
window.electronApi[START_PROXY] = () => {};
window.electronApi[STOP_PROXY] = () => {};
window.electronApi[SET_CERTIFICATE] = () => {};
