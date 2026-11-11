import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireAnyPermissions,
  requirePermissions,
  type AuthUser,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { findCorrectionCustomers, findCorrectionParcels } from './repository';
import { correctParcelCustomer } from './service';

export function assertCustomerCorrectionAccess({
  user,
  body,
}: {
  user: AuthUser | null;
  body?: unknown;
}) {
  requireAuth()({ user });
  requireAnyPermissions(
    PermissionKeys.CanCorrectParcelCustomers,
    PermissionKeys.CanOverrideParcelCustomerDetails,
  )({ user });
  if (body && typeof body === 'object' && 'mode' in body) {
    requirePermissions(
      body.mode === 'profile'
        ? PermissionKeys.CanOverrideParcelCustomerDetails
        : PermissionKeys.CanCorrectParcelCustomers,
    )({ user });
  }
}

const guards = [assertCustomerCorrectionAccess];
export const customerCorrectionRoutes = new Elysia({ name: 'parcel-customer-corrections' })
  .use(authPlugin)
  .get(
    '/customer-corrections/lookup',
    ({ query, user }) => findCorrectionParcels(user!.companyId ?? '', query.bookingCode),
    {
      query: t.Object({ bookingCode: t.String({ minLength: 1, maxLength: 255 }) }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Find company parcels by exact booking code for customer corrections',
      },
    },
  )
  .get(
    '/customer-corrections/customers',
    ({ query, user }) => findCorrectionCustomers(user!.companyId ?? '', query.telephone),
    {
      query: t.Object({ telephone: t.String({ pattern: '^[0-9]{10}$' }) }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Find existing customers by exact primary or secondary telephone',
      },
    },
  )
  .post(
    '/customer-corrections/:id',
    ({ params, body, user }) =>
      correctParcelCustomer({
        ...body,
        parcelId: params.id,
        companyId: user!.companyId ?? '',
        actorUserId: user!.sub,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        expectedVersion: t.String({ minLength: 1, maxLength: 64 }),
        expectedCustomerVersion: t.String({ minLength: 1, maxLength: 64 }),
        party: t.Union([t.Literal('sender'), t.Literal('receiver'), t.Literal('secondReceiver')]),
        mode: t.Union([t.Literal('profile'), t.Literal('relink')]),
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        updateName: t.Boolean(),
        telephone: t.String({ minLength: 10, maxLength: 32 }),
        telephone2: t.Union([t.String({ maxLength: 32 }), t.Null()]),
        customerId: t.Optional(UUID),
        replacementVersion: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        reason: t.String({ minLength: 5, maxLength: 1000 }),
      }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Correct a parcel customer before handover across company branches',
      },
    },
  );
