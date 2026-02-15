import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const reportingRoutes = new Elysia({ name: 'reporting' })
  .get(
    '/cashier-performance',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Cashier performance report');
    },
    {
      query: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        from: t.String({ format: 'date-time' }),
        to: t.String({ format: 'date-time' }),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Cashier performance report',
        operationId: 'getCashierPerformanceReport',
      },
    },
  )
  .get(
    '/shift-revenue',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Shift revenue report');
    },
    {
      query: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        shiftSessionId: t.Optional(UUID),
        from: t.String({ format: 'date-time' }),
        to: t.String({ format: 'date-time' }),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Shift revenue report',
        operationId: 'getShiftRevenueReport',
      },
    },
  )
  .get(
    '/branch-profitability',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Branch profitability report');
    },
    {
      query: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Branch profitability report',
        operationId: 'getBranchProfitabilityReport',
      },
    },
  )
  .get(
    '/credit-exposure',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Credit exposure report');
    },
    {
      query: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        agingBucket: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Credit exposure report',
        operationId: 'getCreditExposureReport',
      },
    },
  )
  .get(
    '/tobepaid-outstanding',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Outstanding to-be-paid report');
    },
    {
      query: t.Object({
        companyId: UUID,
        sourceBranchId: t.Optional(UUID),
        destinationBranchId: t.Optional(UUID),
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Outstanding to-be-paid report',
        operationId: 'getOutstandingToBePaidReport',
      },
    },
  )
  .get(
    '/parcel-status-summary',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Parcel status summary report');
    },
    {
      query: t.Object({
        companyId: UUID,
        branchId: t.Optional(UUID),
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Reporting'],
        summary: 'Parcel status summary report',
        operationId: 'getParcelStatusSummaryReport',
      },
    },
  );
