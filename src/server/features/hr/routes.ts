import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const hrRoutes = new Elysia({ name: 'hr' })
  .get(
    '/employees',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List employees');
    },
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: UUID,
          branchId: t.Optional(UUID),
          roleId: t.Optional(UUID),
          status: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
      ]),
      detail: { tags: ['HR'], summary: 'List employees', operationId: 'listEmployees' },
    },
  )
  .post(
    '/employees',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Create employee');
    },
    {
      body: t.Object({
        companyId: UUID,
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        email: t.Optional(t.String({ format: 'email' })),
        telephone: t.String({ minLength: 7, maxLength: 20 }),
        roleId: UUID,
        branchId: UUID,
        hireDate: t.String({ format: 'date' }),
        baseSalaryCedis: t.Union([t.Number(), t.String()]),
        createdBy: UUID,
      }),
      detail: { tags: ['HR'], summary: 'Create employee', operationId: 'createEmployee' },
    },
  )
  .get(
    '/employees/:id',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Get employee');
    },
    {
      params: t.Object({ id: UUID }),
      detail: { tags: ['HR'], summary: 'Get employee', operationId: 'getEmployee' },
    },
  )
  .patch(
    '/employees/:id',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Update employee');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        roleId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        status: t.Optional(t.String()),
        baseSalaryCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      detail: { tags: ['HR'], summary: 'Update employee', operationId: 'updateEmployee' },
    },
  )
  .post(
    '/attendance/check-in',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Employee attendance check-in');
    },
    {
      body: t.Object({
        employeeId: UUID,
        branchId: UUID,
        locationId: UUID,
        checkedInAt: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['HR'],
        summary: 'Employee attendance check-in',
        operationId: 'checkInAttendance',
      },
    },
  )
  .post(
    '/attendance/check-out',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Employee attendance check-out');
    },
    {
      body: t.Object({
        employeeId: UUID,
        checkedOutAt: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['HR'],
        summary: 'Employee attendance check-out',
        operationId: 'checkOutAttendance',
      },
    },
  )
  .get(
    '/attendance',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Attendance report');
    },
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          employeeId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          from: t.String({ format: 'date' }),
          to: t.String({ format: 'date' }),
        }),
      ]),
      detail: { tags: ['HR'], summary: 'Attendance report', operationId: 'listAttendance' },
    },
  );
