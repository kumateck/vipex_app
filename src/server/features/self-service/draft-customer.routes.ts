import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { updateSelfServiceDraftCustomersSvc } from './draft-customer.service';

const contact = t.Object({
  fullname: t.String({ minLength: 1, maxLength: 255 }),
  phone: t.String(),
  phone2: t.Optional(t.Union([t.String(), t.Null()])),
});
export const draftCustomerRoutes = new Elysia({ name: 'self-service-draft-customers' })
  .use(authPlugin)
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
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCompleteSelfServiceBookings),
      ],
      detail: {
        tags: ['Self-Service'],
        summary: 'Correct sender and receiver details on an unfinished self-service booking',
      },
    },
  );
