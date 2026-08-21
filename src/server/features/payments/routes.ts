import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import {
  collectReceiverPaymentAndDeliverCtrl,
  collectSenderPaymentAndProcessCtrl,
  createPaymentCtrl,
  listPaymentsForParcelCtrl,
  requestReceiverOtpCtrl,
  verifyReceiverOtpCtrl,
} from './controller';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
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
          momoTransactionId?: string | null;
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
        momoTransactionId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Atomically collect sender payment (optional) and mark parcel PROCESSED',
      },
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateSenderPayments)],
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
          storageAmountCedis?: number | string | null;
          receiverOtpVerificationToken: string;
          receiverOtpTarget: 'main' | 'second';
          momoTransactionId?: string | null;
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
        storageAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        receiverOtpVerificationToken: t.String({ minLength: 1 }),
        receiverOtpTarget: t.Union([t.Literal('main'), t.Literal('second')]),
        momoTransactionId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Atomically collect receiver payment (optional) and deliver parcel',
      },
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateReceiverPayments)],
    },
  )
  .post(
    '/receiver-otp/request',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return requestReceiverOtpCtrl({
        ...(body as {
          parcelId: string;
          targetReceiver: 'main' | 'second';
          force?: boolean;
          phoneSlot?: 'primary' | 'secondary';
        }),
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        requestedBy: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        targetReceiver: t.Union([t.Literal('main'), t.Literal('second')]),
        force: t.Optional(t.Boolean()),
        phoneSlot: t.Optional(t.Union([t.Literal('primary'), t.Literal('secondary')])),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Send a receiver pickup verification OTP by SMS (5-minute expiry)',
      },
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanCreateReceiverPayments,
          PermissionKeys.CanCompleteOfficePickup,
        ),
      ],
    },
  )
  .post(
    '/receiver-otp/verify',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return verifyReceiverOtpCtrl({
        ...(body as { parcelId: string; targetReceiver: 'main' | 'second'; otp: string }),
        companyId: authUser.companyId ?? '',
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        targetReceiver: t.Union([t.Literal('main'), t.Literal('second')]),
        otp: t.String({ pattern: '^[0-9]{6}$' }),
      }),
      detail: {
        tags: ['Payments'],
        summary: 'Verify a receiver pickup verification OTP',
      },
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanCreateReceiverPayments,
          PermissionKeys.CanCompleteOfficePickup,
        ),
      ],
    },
  )
  .get('/by-parcel/:parcelId', async ({ params }) => listPaymentsForParcelCtrl(params.parcelId), {
    params: t.Object({ parcelId: UUID }),
    detail: { tags: ['Payments'], summary: 'List payments for a parcel' },
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadPayments)],
  });
