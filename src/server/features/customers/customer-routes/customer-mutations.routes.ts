import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../../utils/http-status';
import { UUID } from '../../../schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createCustomerCtrl, deleteCustomerCtrl, updateCustomerCtrl } from '../controller';

export const customersRoutes3 = new Elysia({ name: 'customers-3' })
  .use(authPlugin)

  .post(
    '/crm',
    async ({ body, set, user }) => {
      const payload = body as {
        fullname: string;
        telephone?: string | null;
        telephone2?: string | null;
        address?: string | null;
        email?: string | null;
        customerType?: number;
        creditEligible?: boolean;
        creditLimitPsw?: number;
        paymentTermsDays?: number;
        isNiaVerified?: boolean;
        loggedToGovernment?: boolean;
      };

      const res = await createCustomerCtrl({
        ...payload,
        sourceContext: 'crm',
        companyId: user!.companyId!,
        createdBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Create customer from CRM context' },
    },
  )

  .post(
    '/',
    async ({ body, set, user }) => {
      const payload = body as {
        fullname: string;
        telephone?: string | null;
        telephone2?: string | null;
        address?: string | null;
        email?: string | null;
        customerType?: number;
        creditEligible?: boolean;
        creditLimitPsw?: number;
        paymentTermsDays?: number;
        isNiaVerified?: boolean;
        loggedToGovernment?: boolean;
      };

      const res = await createCustomerCtrl({
        ...payload,
        sourceContext: 'default',
        companyId: user!.companyId!,
        createdBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Create customer' },
    },
  )

  .patch(
    '/:id/crm',
    async ({ params, body, user }) =>
      updateCustomerCtrl(
        params.id,
        user!.companyId!,
        {
          ...(body as {
            fullname?: string;
            telephone?: string | null;
            telephone2?: string | null;
            address?: string | null;
            email?: string | null;
            customerType?: number;
            creditEligible?: boolean;
            creditLimitPsw?: number;
            paymentTermsDays?: number;
            isNiaVerified?: boolean;
            loggedToGovernment?: boolean;
          }),
          sourceContext: 'crm',
        },
        user!.sub,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Update customer from CRM context' },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateCustomerCtrl(
        params.id,
        user!.companyId!,
        {
          ...(body as {
            fullname?: string;
            telephone?: string | null;
            telephone2?: string | null;
            address?: string | null;
            email?: string | null;
            customerType?: number;
            creditEligible?: boolean;
            creditLimitPsw?: number;
            paymentTermsDays?: number;
            isNiaVerified?: boolean;
            loggedToGovernment?: boolean;
          }),
          sourceContext: 'default',
        },
        user!.sub,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Update customer' },
    },
  )

  .delete(
    '/:id',
    async ({ params, user }) => deleteCustomerCtrl(params.id, user!.companyId!, user!.sub),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteCustomers)],
      detail: { tags: ['Customers'], summary: 'Soft delete customer' },
    },
  );
