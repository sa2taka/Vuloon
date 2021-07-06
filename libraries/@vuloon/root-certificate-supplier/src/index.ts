import { addCertToWindows } from './windows';

export function addCert(filepath: string) {
  if (process.platform === 'win32') {
    addCertToWindows(filepath);
  }
}
