import { describe, expect, test } from 'bun:test';
import type { DeviceStatus, RegisteredDevice } from '../types/device-management.types';
import { countDevicesByFilter, filterDevices } from './device-filters';

const device = (id: string, status: DeviceStatus) => ({ id, status }) as RegisteredDevice;
const devices = [
  device('a', 'pending'),
  device('b', 'approved'),
  device('c', 'revoked'),
  device('d', 'blocked'),
  device('e', 'permanently_denied'),
];

describe('device filters', () => {
  test('groups revoked, blocked and permanently denied together', () => {
    expect(filterDevices(devices, 'blocked').map((d) => d.id)).toEqual(['c', 'd', 'e']);
    expect(filterDevices(devices, 'pending').map((d) => d.id)).toEqual(['a']);
    expect(filterDevices(devices, 'all')).toHaveLength(5);
  });

  test('counts each filter', () => {
    expect(countDevicesByFilter(devices)).toEqual({ pending: 1, approved: 1, blocked: 3, all: 5 });
  });
});
