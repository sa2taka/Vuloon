import * as windows from './windows';

export function setProxy(port: number) {
  if (process.platform === 'win32') {
    windows.setProxy(port);
  }
}

export function enableProxy() {
  if (process.platform === 'win32') {
    windows.enableProxy();
  }
}

export function disableProxy() {
  if (process.platform === 'win32') {
    windows.disableProxy();
  }
}
