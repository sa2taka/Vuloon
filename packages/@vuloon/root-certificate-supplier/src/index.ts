import { addCertToWindows } from './windows';

export const addCert = async (filepath: string): Promise<void> => {
  if (process.platform === 'win32') {
    await addCertToWindows(filepath);
  }
};
