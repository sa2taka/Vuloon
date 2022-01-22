import { exec } from 'sudo-prompt';
import { existsSync } from 'fs';

export async function addCertToWindows(filepath: string): Promise<boolean> {
  const exists = existsSync(filepath);
  if (!exists) {
    return false;
  }
  const sanitized = sanitizeForCmd(filepath);

  return new Promise((resolve) => {
    exec(`certutil -addstore ROOT ${sanitized}`, { name: 'Vuloon' }, (err, stdout) => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
}

function sanitizeForCmd(str: string) {
  return `"${str.replaceAll('\\"', '\\\\"').replaceAll('"', '\\"').replaceAll('%', '^%').replace(/\\$/, '\\\\')}"`;
}
