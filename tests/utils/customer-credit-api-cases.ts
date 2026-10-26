import { expect, test } from 'bun:test';
import type { Elysia } from 'elysia';
import { db } from '@/db/config';
import { companyModules } from '@/db/schemas';

type CreditRequest = (
  path: string,
  method: string,
  body?: unknown,
  user?: string,
) => Promise<Response>;
export function registerCreditApiCases(app: Pick<Elysia, 'handle'>, request: CreditRequest) {
  test('API requires selection, payment permission and charge-update permission', async () => {
    for (const path of [
      'customers/customer/credit/payments',
      'customer-wallet-credit/accounts/customer/payments',
    ]) {
      expect((await request(path, 'POST', { amountCedis: 50 })).status).toBe(400);
      expect(
        (await request(path, 'POST', { parcelIds: ['parcel-a'], amountCedis: 50 }, 'viewer'))
          .status,
      ).toBe(403);
    }
    expect(
      (
        await request(
          'shipments/parcels/parcel-a/credit-charge',
          'PATCH',
          { chargeCedis: 60, expectedChargePsw: 0, method: 4, reason: 'Correct price' },
          'viewer',
        )
      ).status,
    ).toBe(403);
    expect(
      (await request('customer-wallet-credit/accounts/customer/open-parcels', 'GET')).status,
    ).toBe(200);
    expect(
      (
        await request('customer-wallet-credit/accounts/customer/payments', 'POST', {
          parcelIds: ['parcel-a'],
          amountCedis: 50,
        })
      ).status,
    ).toBe(201);
  });
  test('customer type query filters HTTP results and rejects invalid types', async () => {
    for (const type of [0, 1]) {
      const response = await request(`customers/?customerType=${type}`, 'GET');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.totalRecords).toBe(1);
      expect(body.data[0].customerType).toBe(type);
    }
    expect((await request('customers/?customerType=2', 'GET')).status).toBe(400);
  });
  test('unauthenticated, unpermitted and module-disabled finance access is rejected', async () => {
    const path = 'customer-wallet-credit/accounts/customer/open-parcels';
    expect((await app.handle(new Request(`http://localhost/v1/${path}`))).status).toBe(401);
    expect((await request(path, 'GET', undefined, 'viewer')).status).toBe(403);
    await db.update(companyModules).set({ isEnabled: false });
    try {
      expect((await request(path, 'GET')).status).toBe(403);
      expect(
        (
          await request('customer-wallet-credit/accounts/customer/payments', 'POST', {
            parcelIds: ['parcel-a'],
            amountCedis: 50,
          })
        ).status,
      ).toBe(403);
    } finally {
      await db.update(companyModules).set({ isEnabled: true });
    }
  });
}
