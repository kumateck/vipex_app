import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_OTP_EXCEPTION_REASON_LENGTH } from '@/shared/shipments/receiver-otp-exception';
import { authorizeParcelWithoutOtp, readParcelOtpAuthorization } from './exception.service';
import { getPendingOtpApprovals } from './exception-queue.service';

const workflow = t.Union([t.Literal('office_pickup'), t.Literal('receiver_cashier')]);
const handoverTarget = t.Union([t.Literal('main'), t.Literal('second')]);
const params = t.Object({ id: UUID });

export const receiverOtpExceptionRoutes = new Elysia({ name: 'receiver-otp-exception' })
  .use(authPlugin)
  .get(
    '/otp-approval-queue',
    async ({ query, user }) => {
      const queue = await getPendingOtpApprovals({
        ...query,
        companyId: user!.companyId ?? '',
        branchId: user!.branchId ?? '',
        actorUserId: user!.sub,
      });
      return Response.json(queue, { headers: { 'cache-control': 'no-store, private' } });
    },
    {
      query: t.Object({
        workflow,
        page: t.Optional(t.Integer({ minimum: 1, maximum: 100_000 })),
        pageSize: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String({ maxLength: 255 })),
      }),
      beforeHandle: [requireAuth()],
      detail: { tags: ['Shipments'], summary: 'List parcels waiting for OTP confirmation' },
    },
  )
  .post(
    '/:id/otp-authorization',
    ({ params, body, user }) =>
      authorizeParcelWithoutOtp({
        ...body,
        parcelId: params.id,
        companyId: user!.companyId ?? '',
        branchId: user!.branchId ?? '',
        actorUserId: user!.sub,
      }),
    {
      params,
      body: t.Object({
        workflow,
        handoverTarget,
        expectedReceiverId: UUID,
        expectedCollectorId: UUID,
        expectedOtpRequestId: t.Optional(UUID),
        reason: t.String({ maxLength: MAX_OTP_EXCEPTION_REASON_LENGTH }),
      }),
      beforeHandle: [requireAuth()],
      detail: { tags: ['Shipments'], summary: 'Approve one parcel handover without OTP' },
    },
  )
  .get(
    '/:id/otp-authorization',
    async ({ params, query, user }) => {
      const permission =
        query.workflow === 'office_pickup'
          ? PermissionKeys.CanCompleteOfficePickup
          : PermissionKeys.CanCreateReceiverPayments;
      if (!user?.permissions?.includes(permission)) throw Forbidden('Missing handover permission');
      const approval = await readParcelOtpAuthorization({
        ...query,
        parcelId: params.id,
        companyId: user.companyId ?? '',
        branchId: user.branchId ?? '',
      });
      return Response.json({ approval }, { headers: { 'cache-control': 'no-store, private' } });
    },
    {
      params,
      query: t.Object({ workflow, handoverTarget }),
      beforeHandle: [requireAuth()],
      detail: {
        tags: ['Shipments'],
        summary: 'Check for active approval to hand over without OTP',
      },
    },
  );
