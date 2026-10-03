import type { DeviceCredential } from './device.service';
import { BadRequest } from '@/server/utils/http-error';

export function readDeviceCredential(request: Request): DeviceCredential | null {
  const id = request.headers.get('x-vipex-device-id')?.trim();
  const secret = request.headers.get('x-vipex-device-secret')?.trim();
  return id && secret ? { id, secret } : null;
}

export function readNativeClient(request: Request): 'mobile' | 'desktop' | null {
  const client = request.headers.get('x-vipex-client');
  if (client && client !== 'mobile' && client !== 'desktop') {
    throw BadRequest('Unsupported client type');
  }
  return client === 'mobile' || client === 'desktop' ? client : null;
}
