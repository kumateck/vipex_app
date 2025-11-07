import { Elysia, t } from 'elysia';
import { createBookingWithParcelsCtrl } from './booking-with-parcels.controller';

export const bookingWithParcelsRoutes = new Elysia({ name: 'booking-create-with-parcels' }).post(
  '/create-with-parcels',
  async ({ body, set }) => {
    const res = await createBookingWithParcelsCtrl(
      body as {
        senderId: string;
        companyId: string;
        sourceId: string;
        statusId: string;
        createdBy: string;
        cashierSessionId?: string | null;
        bookingCode?: string | null;
        parcels: Array<{
          destinationId: string;
          receiverId: string;
          statusId: string;
          parcelDetails: string;
          parcelContent: string;
          parcelValueCedis?: number | string | null;
          plannedToBePaidCedis?: number | string | null;
          method: number;
          trackingCode?: string | null;
          senderPaymentCedis?: number | string | null;
          senderPaymentMethod?: number;
          cashierUserId: string;
          branchId: string;
        }>;
      },
    );
    set.status = 201;
    return res;
  },
  {
    body: t.Object({
      senderId: t.String({ format: 'uuid' }),
      companyId: t.String({ format: 'uuid' }),
      sourceId: t.String({ format: 'uuid' }),
      statusId: t.String({ format: 'uuid' }),
      createdBy: t.String({ format: 'uuid' }),
      cashierSessionId: t.Optional(t.String({ format: 'uuid' })),
      bookingCode: t.Optional(t.String()),
      parcels: t.Array(
        t.Object({
          destinationId: t.String({ format: 'uuid' }),
          receiverId: t.String({ format: 'uuid' }),
          statusId: t.String({ format: 'uuid' }),
          parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
          parcelContent: t.String({ minLength: 1, maxLength: 255 }),
          parcelValueCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
          plannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
          method: t.Number(), // PaymentMethod enum value
          trackingCode: t.Optional(t.Union([t.String(), t.Null()])),
          senderPaymentCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
          senderPaymentMethod: t.Optional(t.Number()),
          cashierUserId: t.String({ format: 'uuid' }),
          branchId: t.String({ format: 'uuid' }),
        }),
        { minItems: 1 },
      ),
    }),
    detail: {
      tags: ['Shipments'],
      summary: 'Create booking with parcels and optional sender payments (atomic)',
      description:
        'Creates a booking, N parcels, and optional sender principal payments per parcel in a single transaction. Money is accepted in cedis.decimals and stored as pesewas.',
    },
  },
);
