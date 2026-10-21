import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { errorHandler } from '@/server/middlewares/error-handler';
import {
  parcelStickerPaymentRoutes,
  assertStickerPaymentAccess,
} from '@/server/features/shipments/parcel-sticker-payment.routes';
import { PermissionKeys } from '@/shared/permissions/constants';

const app = new Elysia().use(errorHandler).use(parcelStickerPaymentRoutes);

describe('sticker payment verification endpoint', () => {
  test('requires a permitted booking, payment or reprint workflow', () => {
    const user = { sub: 'staff', email: 'staff@example.test', permissions: [] as string[] };
    expect(() => assertStickerPaymentAccess({ user: null })).toThrow();
    expect(() => assertStickerPaymentAccess({ user })).toThrow();
    for (const permission of [
      PermissionKeys.CanCreateBookingWithParcels,
      PermissionKeys.CanCompleteSelfServiceBookings,
      PermissionKeys.CanCreateSenderPayments,
      PermissionKeys.CanCreateReceiverPayments,
      PermissionKeys.CanReadConsignments,
      PermissionKeys.CanReadParcelOutgoing,
      PermissionKeys.CanReadParcels,
    ]) {
      expect(() =>
        assertStickerPaymentAccess({ user: { ...user, permissions: [permission] } }),
      ).not.toThrow();
    }
  });
  test('registers the shared web, desktop and mobile route and requires authentication', async () => {
    const path = '/v1/shipments/parcels/sticker-payment';
    expect(app.routes.some((route) => route.method === 'GET' && route.path === path)).toBe(true);
    const response = await app.handle(
      new Request(`http://localhost${path}?bookingCode=B1&trackingCode=T1`),
    );
    expect(response.status).toBe(401);
  });
});
