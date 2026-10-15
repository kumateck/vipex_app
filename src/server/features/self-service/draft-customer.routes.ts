import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  updateSelfServiceDraftCustomersSvc,
  updateSelfServiceDraftSvc,
} from './draft-customer.service';

const contact = t.Object({
  fullname: t.String({ minLength: 1, maxLength: 255 }),
  phone: t.String(),
  phone2: t.Optional(t.Union([t.String(), t.Null()])),
});
const guard = [requireAuth(), requirePermissions(PermissionKeys.CanCompleteSelfServiceBookings)];
export const draftCustomerRoutes = new Elysia({ name: 'self-service-draft-customers' })
  .use(authPlugin)
  .patch(
    '/drafts/:id',
    ({ params, body, user }) => {
      const { sender, receiver, expectedUpdatedAt, ...details } = body;
      return updateSelfServiceDraftSvc(
        params.id,
        { sender, receiver, expectedUpdatedAt, details },
        user!,
      );
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        sender: contact,
        receiver: contact,
        destinationBranchId: t.Optional(UUID),
        destinationLocationId: t.Optional(t.Union([UUID, t.Null()])),
        parcelContent: t.String({ minLength: 1, maxLength: 255 }),
        parcelValueCedis: t.Union([t.Number({ minimum: 0 }), t.String()]),
        expectedUpdatedAt: t.String({ format: 'date-time' }),
      }),
      beforeHandle: guard,
      detail: {
        tags: ['Self-Service'],
        summary: 'Correct every customer-entered detail on an unfinished self-service booking',
      },
    },
  )
  .patch(
    '/drafts/:id/customers',
    ({ params, body, user }) => updateSelfServiceDraftCustomersSvc(params.id, body, user!),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        sender: contact,
        receiver: contact,
        expectedUpdatedAt: t.String({ format: 'date-time' }),
      }),
      beforeHandle: guard,
      detail: {
        tags: ['Self-Service'],
        summary: 'Correct sender and receiver details on an unfinished self-service booking',
      },
    },
  );
