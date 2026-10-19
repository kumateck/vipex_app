import type { DeviceStatus, RegisteredDevice } from '../types/device-management.types';

export type DeviceFilter = 'pending' | 'approved' | 'blocked' | 'all';

const FILTER_STATUSES: Record<Exclude<DeviceFilter, 'all'>, DeviceStatus[]> = {
  pending: ['pending'],
  approved: ['approved'],
  blocked: ['revoked', 'blocked', 'permanently_denied'],
};

export const DEVICE_FILTER_LABELS: Record<DeviceFilter, string> = {
  pending: 'Pending',
  approved: 'Approved',
  blocked: 'Revoked & blocked',
  all: 'All',
};

export function filterDevices(devices: RegisteredDevice[], filter: DeviceFilter) {
  if (filter === 'all') return devices;
  const statuses = FILTER_STATUSES[filter];
  return devices.filter((device) => statuses.includes(device.status));
}

export function countDevicesByFilter(devices: RegisteredDevice[]) {
  const counts: Record<DeviceFilter, number> = { pending: 0, approved: 0, blocked: 0, all: 0 };
  for (const device of devices) {
    counts.all += 1;
    if (device.status === 'pending') counts.pending += 1;
    else if (device.status === 'approved') counts.approved += 1;
    else counts.blocked += 1;
  }
  return counts;
}
