import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import {
  collectReceiverPaymentAndDeliverCtrl,
  collectSenderPaymentAndProcessCtrl,
  createPaymentCtrl,
  listPaymentsForParcelCtrl,
} from './controller';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

export const paymentsRoutes = new Elysia({ name: 'payments' })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const res = await createPaymentCtrl({
        ...(body as {
          parcelId: string;
          component: number;
          payer: number;
          cashierType: number;
          method: number;
          amountCedis: number | string;
          receivedAt?: string;
          notes?: string | null;
          receiptNo?: string | null;
        }),
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        cashierUserId: authUser.sub,
      } as {
        companyId: string;
        branchId: string;
        parcelId: string;
        component: number;
        payer: number;
        cashierType: number;
        method: number;
        cashierUserId: string;
        amountCedis: number | string;
        receivedAt?: string;
        notes?: string | null;
        receiptNo?: string | null;
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        parcelId: UUID,
        component: t.Number(), // enum value
        payer: t.Number(),
        cashierType: t.Number(),
        method: t.Number(),
        amountCedis: t.Union([t.Number(), t.String()]),
        receivedAt: t.Optional(t.String({ format: 'date-time' })),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        receiptNo: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Create payment (principal taxable, delivery fee not taxable)',
      },
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreatePayments)],
    },
  )
  .post(
    '/collect-sender-and-process',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return collectSenderPaymentAndProcessCtrl({
        ...(body as {
          parcelId: string;
          method: number;
          amountCedis?: number | string | null;
        }),
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        cashierUserId: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        method: t.Number(),
        amountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Atomically collect sender payment (optional) and mark parcel PROCESSED',
      },
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreatePayments)],
    },
  )
  .post(
    '/collect-receiver-and-deliver',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return collectReceiverPaymentAndDeliverCtrl({
        ...(body as {
          parcelId: string;
          method: number;
          confirmedBy: string;
          secondReceiverId?: string | null;
          cardId?: string | null;
          cardNumber?: string | null;
          secondCardId?: string | null;
          secondCardNumber?: string | null;
          amountCedis?: number | string | null;
        }),
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        cashierUserId: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        method: t.Number(),
        confirmedBy: UUID,
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
        cardId: t.Optional(t.Union([UUID, t.Null()])),
        cardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        secondCardId: t.Optional(t.Union([UUID, t.Null()])),
        secondCardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        amountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Atomically collect receiver payment (optional) and deliver parcel',
      },
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreatePayments, PermissionKeys.CanUpdateParcels),
      ],
    },
  )
  .get('/by-parcel/:parcelId', async ({ params }) => listPaymentsForParcelCtrl(params.parcelId), {
    params: t.Object({ parcelId: UUID }),
    detail: { tags: ['Payments'], summary: 'List payments for a parcel' },
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadPayments)],
  });
