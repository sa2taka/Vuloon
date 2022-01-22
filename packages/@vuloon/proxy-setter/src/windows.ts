import { exec } from 'sudo-prompt';

export async function setProxy(port: number): Promise<boolean> {
  const sanitized = sanitizeForCmd(port.toString());
  return new Promise((resolve) => {
    exec(
      `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyServer /t reg_sz /d "localhost:${sanitized}"`,
      { name: 'Vuloon' },
      (err, stdout) => {
        if (err) {
          resolve(false);
        }
        resolve(true);
      }
    );
  });
}

export async function enableProxy(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyEnable /t reg_dword /d 1`,
      { name: 'Vuloon' },
      (err, stdout) => {
        if (err) {
          resolve(false);
        }
        resolve(true);
      }
    );
  });
}

export async function disableProxy(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /f /v ProxyEnable /t reg_dword /d 0`,
      { name: 'Vuloon' },
      (err, stdout) => {
        if (err) {
          resolve(false);
        }
        resolve(true);
      }
    );
  });
}

function sanitizeForCmd(str: string) {
  return `"${str.replaceAll('\\"', '\\\\"').replaceAll('"', '\\"').replaceAll('%', '^%').replace(/\\$/, '\\\\')}"`;
}
