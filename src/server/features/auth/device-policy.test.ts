import { expect, test } from 'bun:test';
import { DEFAULT_MODULE_CATALOG } from '@/shared/company-modules/catalog';
import { inferRequiredModuleByPath } from '@/shared/company-modules/route-modules';
import { DEVICE_VERIFICATION_MODULE, isDeviceVerificationRequired } from './device-policy';

test('device verification is an optional company module', () => {
  const module = DEFAULT_MODULE_CATALOG.find((entry) => entry.code === DEVICE_VERIFICATION_MODULE);
  expect(module?.isActive).toBe(true);
  expect(module?.isCore).toBe(false);
  expect(inferRequiredModuleByPath('/users/devices')).toBe(DEVICE_VERIFICATION_MODULE);
});

test('approval is required only for companies with the module enabled', async () => {
  const seen: string[] = [];
  const lookup = async (companyId: string, moduleCode: string) => {
    seen.push(`${companyId}:${moduleCode}`);
    return companyId === 'enabled' ? { isEnabled: true } : { isEnabled: false };
  };
  expect(await isDeviceVerificationRequired(null, lookup)).toBe(false);
  expect(await isDeviceVerificationRequired('disabled', lookup)).toBe(false);
  expect(await isDeviceVerificationRequired('enabled', lookup)).toBe(true);
  expect(await isDeviceVerificationRequired('missing', async () => null)).toBe(false);
  expect(seen).toEqual(['disabled:device_verification', 'enabled:device_verification']);
});
