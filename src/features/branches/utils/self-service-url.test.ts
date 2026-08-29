import { describe, expect, test } from 'bun:test';
import { buildSelfServiceUrl } from './self-service-url';

describe('buildSelfServiceUrl', () => {
  test('uses the development LAN address when the current host is localhost', () => {
    expect(
      buildSelfServiceUrl({
        branchId: 'branch 123',
        currentOrigin: 'http://localhost:5173',
        developmentHost: '192.168.1.25',
        isDevelopment: true,
      }),
    ).toBe('http://192.168.1.25:5173/self-service/branch%20123?scan=1');
  });

  test('keeps an existing network host in development', () => {
    expect(
      buildSelfServiceUrl({
        branchId: 'branch-123',
        currentOrigin: 'http://192.168.1.30:5173',
        developmentHost: '192.168.1.25',
        isDevelopment: true,
      }),
    ).toBe('http://192.168.1.30:5173/self-service/branch-123?scan=1');
  });

  test('does not replace the production origin', () => {
    expect(
      buildSelfServiceUrl({
        branchId: 'branch-123',
        currentOrigin: 'https://app.vipexparcels.com',
        developmentHost: '192.168.1.25',
        isDevelopment: false,
      }),
    ).toBe('https://app.vipexparcels.com/self-service/branch-123?scan=1');
  });
});
