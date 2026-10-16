import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requireModuleEnabled,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { RECEIPT_DELIVERY_CHANNELS, RECEIPT_KINDS } from '@/shared/digital-receipts/channels';
import { DIGITAL_RECEIPTS_MODULE_CODE } from './constants';
import { sendDigitalReceiptSvc } from './delivery.service';
import {
  getCustomerReceiptPreferenceSvc,
  getParcelReceiptOptionsSvc,
  saveCustomerReceiptPreferenceSvc,
} from './preference.service';

const tags = ['Digital Receipts'];
const moduleGate = requireModuleEnabled(DIGITAL_RECEIPTS_MODULE_CODE);
// Staff who issue receipts at the counter, the receiver cashier, or home delivery.
const receiptStaff = requireAnyPermissions(
  PermissionKeys.CanCreateParcels,
  PermissionKeys.CanCreateSenderPayments,
  PermissionKeys.CanCreateReceiverPayments,
  PermissionKeys.CanCompleteOfficePickup,
  PermissionKeys.CanDispatchForDelivery,
  PermissionKeys.CanReadParcels,
);
const guards = [requireAuth(), receiptStaff, moduleGate];
const kind = t.Union(RECEIPT_KINDS.map((value) => t.Literal(value)));
const channels = t.Array(t.Union(RECEIPT_DELIVERY_CHANNELS.map((value) => t.Literal(value))), {
  maxItems: RECEIPT_DELIVERY_CHANNELS.length,
});
const companyOf = (user: unknown) => (user as AuthUser).companyId!;

export const digitalReceiptRoutes = new Elysia({ name: 'digital-receipts' })
  .use(authPlugin)
  .get(
    '/customers/:id/preference',
    ({ params, user }) => getCustomerReceiptPreferenceSvc(companyOf(user), params.id),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: guards,
      detail: { tags, summary: "Get a customer's default receipt delivery channels" },
    },
  )
  .put(
    '/customers/:id/preference',
    ({ params, body, user }) =>
      saveCustomerReceiptPreferenceSvc({
        companyId: companyOf(user),
        customerId: params.id,
        channels: body.channels,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ channels }),
      beforeHandle: guards,
      detail: { tags, summary: "Save a customer's default receipt delivery channels" },
    },
  )
  .get(
    '/parcels/:id/options',
    ({ params, query, user }) =>
      getParcelReceiptOptionsSvc({
        companyId: companyOf(user),
        parcelId: params.id,
        kind: query.kind,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({ kind }),
      beforeHandle: guards,
      detail: { tags, summary: 'Recipients and default channels for a parcel receipt' },
    },
  )
  .post(
    '/parcels/:id/send',
    ({ params, body, user }) =>
      sendDigitalReceiptSvc({
        companyId: companyOf(user),
        actorUserId: (user as AuthUser).sub,
        parcelId: params.id,
        kind: body.kind,
        channels: body.channels,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ kind, channels }),
      beforeHandle: guards,
      detail: { tags, summary: 'Send (or resend) a digital receipt by SMS, WhatsApp or email' },
    },
  );
