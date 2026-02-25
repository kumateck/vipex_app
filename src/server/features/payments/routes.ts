import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import { createPaymentCtrl, listPaymentsForParcelCtrl } from './controller';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

export const paymentsRoutes = new Elysia({ name: 'payments' })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const res = await createPaymentCtrl(
        {
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
        },
      );
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
  .get('/by-parcel/:parcelId', async ({ params }) => listPaymentsForParcelCtrl(params.parcelId), {
    params: t.Object({ parcelId: UUID }),
    detail: { tags: ['Payments'], summary: 'List payments for a parcel' },
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadPayments)],
  });
