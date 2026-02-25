import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const payrollRoutes = new Elysia({ name: 'payroll' })
  .get(
    '/cycles',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List payroll cycles');
    },
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: UUID,
          branchId: t.Optional(UUID),
          status: t.Optional(t.String()),
          month: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
          year: t.Optional(t.Number({ minimum: 2020, maximum: 2100 })),
        }),
      ]),
      detail: { tags: ['Payroll'], summary: 'List payroll cycles', operationId: 'listPayrollCycles' },
    },
  )
  .post(
    '/cycles',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Create payroll cycle');
    },
    {
      body: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        periodStart: t.String({ format: 'date' }),
        periodEnd: t.String({ format: 'date' }),
        createdBy: UUID,
      }),
      detail: { tags: ['Payroll'], summary: 'Create payroll cycle', operationId: 'createPayrollCycle' },
    },
  )
  .post(
    '/cycles/:id/run',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Run payroll cycle');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ initiatedBy: UUID }),
      detail: { tags: ['Payroll'], summary: 'Run payroll cycle', operationId: 'runPayrollCycle' },
    },
  )
  .post(
    '/cycles/:id/approve',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Approve payroll cycle');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ approvedBy: UUID, comments: t.Optional(t.String()) }),
      detail: {
        tags: ['Payroll'],
        summary: 'Approve payroll cycle',
        operationId: 'approvePayrollCycle',
      },
    },
  )
  .get(
    '/cycles/:id/payslips',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List payslips');
    },
    {
      params: t.Object({ id: UUID }),
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          employeeId: t.Optional(UUID),
        }),
      ]),
      detail: { tags: ['Payroll'], summary: 'List payslips', operationId: 'listPayslips' },
    },
  )
  .post(
    '/cycles/:id/journalize',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Post payroll journal entries');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ postedBy: UUID }),
      detail: {
        tags: ['Payroll'],
        summary: 'Post payroll journal entries',
        operationId: 'journalizePayrollCycle',
      },
    },
  );
