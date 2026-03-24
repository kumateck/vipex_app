import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import {
  UUID,
  NonEmptyString255,
  PaginationRequestQueryProps,
  SmallInt,
} from '../../schemas/common';
import {
  listPendingBookingsCtrl,
  getPendingBookingCtrl,
  createPendingBookingCtrl,
  confirmPendingBookingCtrl,
  cancelPendingBookingCtrl,
  cleanupExpiredPendingBookingsCtrl,
} from './pending-bookings.controller';
import type {
  CreatePendingBookingInput,
  ConfirmPendingBookingInput,
} from './pending-bookings.service';

type ConfirmPendingBookingBody = Omit<ConfirmPendingBookingInput, 'pendingBookingId'>;
type CancelPendingBookingBody = {
  cancelledBy: string;
  reason?: string;
};

export const pendingBookingsRoutes = new Elysia({ name: 'pending-bookings' })
  // List pending bookings for a branch
  .get(
    '/',
    async ({ query }) =>
      listPendingBookingsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          branchId: query.branchId,
          status: query.status,
          attendantId: query.attendantId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        branchId: UUID,
        status: t.Optional(SmallInt),
        attendantId: t.Optional(UUID),
      }),
      detail: {
        tags: ['Shipments'],
        summary: 'List pending bookings',
        operationId: 'listPendingBookings',
      },
    },
  )

  // Get single pending booking
  .get('/:id', async ({ params }) => getPendingBookingCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Shipments'],
      summary: 'Get pending booking',
      operationId: 'getPendingBooking',
    },
  })

  // Create pending booking (attendant action)
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createPendingBookingCtrl(body as CreatePendingBookingInput);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        branchId: UUID,
        bookingData: t.Object({
          senderInfo: t.Object({
            fullname: NonEmptyString255,
            telephone: t.Optional(t.String()),
            telephone2: t.Optional(t.String()),
            address: t.Optional(t.String()),
            email: t.Optional(t.String()),
          }),
          receiverInfo: t.Object({
            fullname: NonEmptyString255,
            telephone: t.Optional(t.String()),
            telephone2: t.Optional(t.String()),
            address: t.Optional(t.String()),
            email: t.Optional(t.String()),
          }),
          parcelDetails: t.Object({
            details: NonEmptyString255,
            content: NonEmptyString255,
            value: t.String(), // in cedis
          }),
          destinationBranchId: UUID,
          deliveryMode: t.Number(), // 0 = OFFICE, 1 = DOORSTEP
        }),
        paymentResponsibility: t.Number(), // 0 = SENDER, 1 = RECIPIENT, 2 = SPLIT
        senderAmount: t.Optional(t.String()), // in cedis
        recipientAmount: t.Optional(t.String()), // in cedis
        attendantId: UUID,
        expiresAt: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Shipments'],
        summary: 'Create pending booking (attendant)',
        operationId: 'createPendingBooking',
      },
    },
  )

  // Confirm pending booking (cashier action)
  .post(
    '/:id/confirm',
    async ({ body, params }) =>
      confirmPendingBookingCtrl({
        pendingBookingId: params.id,
        ...(body as ConfirmPendingBookingBody),
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        cashierId: UUID,
        paymentMethod: t.Number(), // 0 = CASH, 1 = MTN, 2 = TELECEL, 3 = AIRTEL
        receivedAmount: t.String(), // in cedis
        cashierSessionId: UUID,
      }),
      detail: {
        tags: ['Shipments'],
        summary: 'Confirm pending booking (cashier)',
        operationId: 'confirmPendingBooking',
      },
    },
  )

  // Cancel pending booking
  .post(
    '/:id/cancel',
    async ({ body, params }) =>
      cancelPendingBookingCtrl(
        params.id,
        (body as CancelPendingBookingBody).cancelledBy,
        (body as CancelPendingBookingBody).reason,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        cancelledBy: UUID,
        reason: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Shipments'],
        summary: 'Cancel pending booking',
        operationId: 'cancelPendingBooking',
      },
    },
  )

  // Cleanup expired pending bookings (admin/scheduled job)
  .post('/cleanup-expired', async () => cleanupExpiredPendingBookingsCtrl(), {
    detail: {
      tags: ['Shipments'],
      summary: 'Cleanup expired pending bookings',
      operationId: 'cleanupExpiredPendingBookings',
    },
  });
