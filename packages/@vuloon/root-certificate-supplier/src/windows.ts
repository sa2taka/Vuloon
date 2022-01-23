import { exec } from 'sudo-prompt';
import { existsSync } from 'fs';

export async function addCertToWindows(filepath: string): Promise<boolean> {
  const exists = existsSync(filepath);
  if (!exists) {
    return false;
  }
  const sanitized = sanitizeForCmd(filepath);

  return new Promise((resolve, reject) => {
    exec(`certutil -addstore ROOT ${sanitized}`, { name: 'Vuloon' }, (err, stdout) => {
      if (err) {
        reject(err);
      }
      resolve(true);
    });
  });
}

function sanitizeForCmd(str: string) {
  return `"${str.replaceAll('\\"', '\\\\"').replaceAll('"', '\\"').replaceAll('%', '^%').replace(/\\$/, '\\\\')}"`;
}
