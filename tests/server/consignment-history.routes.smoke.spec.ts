import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys, RoutePermissionOverrides } from '@/shared/permissions/constants';
import { http } from '../utils/request';

describe('previous consignment reprint routes', () => {
  test('page uses the consignment history read permission', () => {
    expect(RoutePermissionOverrides['/parcels/consignments/history']).toBe(
      PermissionKeys.CanReadConsignmentsHistory,
    );
  });

  test('history and print endpoints are mounted and protected', async () => {
    const history = await http(
      'GET',
      '/v1/shipments/consignments/history?dateFrom=2026-08-01&dateTo=2026-08-20',
    );
    const print = await http('GET', '/v1/shipments/consignments/consignment_test/print');

    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(history.status);
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(print.status);
  });
});
