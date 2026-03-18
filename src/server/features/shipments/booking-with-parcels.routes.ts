import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import { createBookingWithParcelsCtrl } from './booking-with-parcels.controller';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

export const bookingWithParcelsRoutes = new Elysia({ name: 'booking-create-with-parcels' })
  .use(authPlugin)
  .post(
    '/create-with-parcels',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const payload = body as {
        senderId: string;
        status: number;
        cashierSessionId?: string | null;
        bookingCode?: string | null;
        parcels: Array<{
          destinationId: string;
          receiverId: string;
          status: number;
          parcelDetails: string;
          parcelContent: string;
          parcelValueCedis?: number | string | null;
          chargeCedis?: number | string | null;
          plannedToBePaidCedis?: number | string | null;
          method: number;
          trackingCode?: string | null;
          senderPaymentCedis?: number | string | null;
          senderPaymentMethod?: number;
        }>;
      };
      const res = await createBookingWithParcelsCtrl(
        {
          senderId: payload.senderId,
          companyId: authUser.companyId ?? '',
          sourceId: authUser.branchId ?? '',
          status: payload.status,
          createdBy: authUser.sub,
          cashierSessionId: payload.cashierSessionId ?? null,
          bookingCode: payload.bookingCode ?? null,
          parcels: payload.parcels.map((parcel) => ({
            ...parcel,
            cashierUserId: authUser.sub,
            branchId: authUser.branchId ?? '',
          })),
        },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        senderId: UUID,
        status: t.Number(),
        cashierSessionId: t.Optional(UUID),
        bookingCode: t.Optional(t.String()),
        parcels: t.Array(
          t.Object({
            destinationId: UUID,
            receiverId: UUID,
            status: t.Number(),
            parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
            parcelContent: t.String({ minLength: 1, maxLength: 255 }),
            parcelValueCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
            chargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
            plannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
            method: t.Number(), // PaymentMethod enum value
            trackingCode: t.Optional(t.Union([t.String(), t.Null()])),
            senderPaymentCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
            senderPaymentMethod: t.Optional(t.Number()),
          }),
          { minItems: 1 },
        ),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBookingWithParcels)],
      detail: {
        tags: ['Shipments'],
        summary: 'Create booking with parcels and optional sender payments (atomic)',
        description:
          'Creates a booking, N parcels, and optional sender principal payments per parcel in a single transaction. Money is accepted in cedis.decimals and stored as pesewas.',
      },
    },
  );
