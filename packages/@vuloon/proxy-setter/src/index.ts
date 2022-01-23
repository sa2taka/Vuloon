import * as windows from './windows';

export async function setProxy(port: number): Promise<boolean> {
  if (process.platform === 'win32') {
    windows.setProxy(port);
  }
  return false;
}

export async function enableProxy(): Promise<boolean> {
  if (process.platform === 'win32') {
    windows.enableProxy();
  }
  return false;
}

export async function disableProxy(): Promise<boolean> {
  if (process.platform === 'win32') {
    windows.disableProxy();
  }
  return false;
}
