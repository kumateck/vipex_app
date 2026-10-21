import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAnyPermissions,
  requireAuth,
  type AuthUser,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getVerifiedStickerPayment } from './parcel-sticker-payment.service';

export function assertStickerPaymentAccess(context: { user: AuthUser | null }) {
  requireAuth()(context);
  requireAnyPermissions(
    PermissionKeys.CanCreateBookingWithParcels,
    PermissionKeys.CanCompleteSelfServiceBookings,
    PermissionKeys.CanCreateSenderPayments,
    PermissionKeys.CanCreateReceiverPayments,
    PermissionKeys.CanReadConsignments,
    PermissionKeys.CanReadParcelOutgoing,
    PermissionKeys.CanReadParcels,
  )(context);
}

export const parcelStickerPaymentRoutes = new Elysia({ name: 'parcel-sticker-payment' })
  .use(authPlugin)
  .get(
    '/v1/shipments/parcels/sticker-payment',
    ({ query, user, set }) => {
      set.headers['Cache-Control'] = 'no-store';
      return getVerifiedStickerPayment(query, user as AuthUser);
    },
    {
      query: t.Object({
        trackingCode: t.String({ minLength: 1, maxLength: 255 }),
        bookingCode: t.String({ minLength: 1, maxLength: 255 }),
      }),
      beforeHandle: [assertStickerPaymentAccess],
      detail: {
        tags: ['Shipments'],
        summary: 'Verify current parcel payment before sticker printing',
      },
    },
  );
