import { app, safeStorage, session } from 'electron';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type DeviceCredential = { id: string; secret: string };
type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'blocked' | 'permanently_denied';

let credential: DeviceCredential | null = null;

function credentialPath() {
  return path.join(app.getPath('userData'), 'device-credential.enc');
}

export async function loadDesktopDeviceCredential() {
  try {
    const encrypted = await fs.readFile(credentialPath());
    credential = JSON.parse(safeStorage.decryptString(encrypted)) as DeviceCredential;
  } catch {
    credential = null;
  }
}

async function saveDesktopDeviceCredential(next: DeviceCredential) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Operating-system secure storage is unavailable. Device registration stopped.');
  }
  const target = credentialPath();
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, safeStorage.encryptString(JSON.stringify(next)), { mode: 0o600 });
  await fs.rename(temporary, target);
  credential = next;
}

function deviceApiUrl(baseUrl: string, pathPart: string) {
  return new URL(`v1/auth/devices/${pathPart}`, baseUrl).toString();
}

export async function getDesktopDeviceStatus(baseUrl: string): Promise<DeviceStatus | null> {
  if (!credential) return null;
  const response = await fetch(deviceApiUrl(baseUrl, 'status'), {
    headers: {
      'x-vipex-client': 'desktop',
      'x-vipex-device-id': credential.id,
      'x-vipex-device-secret': credential.secret,
    },
  });
  if (!response.ok) throw new Error('Could not check this device registration.');
  const result = (await response.json()) as { status: DeviceStatus };
  return result.status;
}

export async function registerDesktopDevice(baseUrl: string, email: string, password: string) {
  if (credential) return getDesktopDeviceStatus(baseUrl);
  const response = await fetch(deviceApiUrl(baseUrl, 'register'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vipex-client': 'desktop' },
    body: JSON.stringify({
      email,
      password,
      kind: 'desktop',
      deviceName: os.hostname(),
      model: os.arch(),
      osName: os.platform(),
      osVersion: os.release(),
      appVersion: app.getVersion(),
    }),
  });
  if (!response.ok) throw new Error('Device registration failed. Check your credentials.');
  const result = (await response.json()) as DeviceCredential & { status: DeviceStatus };
  await saveDesktopDeviceCredential({ id: result.id, secret: result.secret });
  return result.status;
}

export function installDesktopDeviceHeaders(allowedOrigins: string[]) {
  const origins = new Set(
    allowedOrigins.flatMap((url) => {
      const http = new URL(url);
      const socket = new URL(url);
      socket.protocol = http.protocol === 'https:' ? 'wss:' : 'ws:';
      return [http.origin, socket.origin];
    }),
  );
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = new URL(details.url);
    if (!origins.has(url.origin) || !url.pathname.startsWith('/v1/')) {
      callback({ requestHeaders: details.requestHeaders });
      return;
    }
    const headers: Record<string, string> = {
      ...details.requestHeaders,
      'x-vipex-client': 'desktop',
    };
    if (credential) {
      headers['x-vipex-device-id'] = credential.id;
      headers['x-vipex-device-secret'] = credential.secret;
    }
    callback({ requestHeaders: headers });
  });
}
