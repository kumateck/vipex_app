import { NativeModules, Platform } from 'react-native';
import { ENV } from './env';
import { getItemAsync, setItemAsync } from './secure-store-compat';

const DEVICE_CREDENTIAL_KEY = 'vipex_mobile_device_credential_v1';

export type DeviceCredential = { id: string; secret: string };
export type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'blocked' | 'permanently_denied';

export async function loadDeviceCredential(): Promise<DeviceCredential | null> {
  const raw = await getItemAsync(DEVICE_CREDENTIAL_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as DeviceCredential;
    return value.id && value.secret ? value : null;
  } catch {
    return null;
  }
}

export async function saveDeviceCredential(credential: DeviceCredential): Promise<void> {
  await setItemAsync(DEVICE_CREDENTIAL_KEY, JSON.stringify(credential));
}

export function getMobileDeviceMetadata() {
  const constants = NativeModules.PlatformConstants as Record<string, unknown> | undefined;
  const model = constants?.Model ?? constants?.model;
  const modelName = typeof model === 'string' ? model.slice(0, 120) : undefined;
  return {
    kind: 'mobile' as const,
    deviceName: (modelName || `${Platform.OS} device`).slice(0, 160),
    model: modelName,
    osName: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: ENV.appVersion,
  };
}
