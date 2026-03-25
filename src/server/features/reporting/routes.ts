import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import { BranchType } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';
import {
  authPlugin,
  requireAuth,
  requireAnyPermissions,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  getAttendanceReportSvc,
  getBranchProfitabilityReportSvc,
  getCashierDaySessionsReportSvc,
  getCreditExposureReportSvc,
  getCustomerCreditAgingDetailReportSvc,
  getDailyCashConfirmationReportSvc,
  getDailyCashierSalesReportSvc,
  getDeliveryPerformanceReportSvc,
  getEmployeeMasterReportSvc,
  getExpenseByCategoryReportSvc,
  getLeaveRequestsReportSvc,
  getOutstandingToBePaidReportSvc,
  getParcelStatusSummaryReportSvc,
  getPayrollAdjustmentsReportSvc,
  getPayrollJournalReconciliationReportSvc,
  getPayrollOvertimeReportSvc,
  getPayrollRegisterReportSvc,
  getShiftRevenueReportSvc,
  getToBePaidCollectionsReconciliationReportSvc,
} from './service';

export const reportingRoutes = new Elysia({ name: 'reporting' })
  .use(authPlugin)
  .get(
    '/daily-cashier-sales',
    async ({ user, query }) => {
      const authUser = user!;
      if (!authUser.companyId) {
        throw Forbidden('Authenticated user company context is missing');
      }

      const isHeadOffice = authUser.branchType === BranchType.HEADOFFICE;
      const effectiveBranchId = isHeadOffice ? (query.branchId ?? null) : authUser.branchId;
      if (!isHeadOffice && !effectiveBranchId) {
        throw Forbidden('Authenticated user branch/company context is missing');
      }

      const canSelectCashier = (authUser.permissions ?? []).includes(
        PermissionKeys.CanReadAccounting,
      );

      return getDailyCashierSalesReportSvc({
        companyId: authUser.companyId,
        branchId: effectiveBranchId,
        viewerUserId: authUser.sub,
        canSelectCashier,
        date: query.date,
        requestedBranchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        cashierUserId: query.cashierUserId ?? null,
        cashierType: query.cashierType ?? null,
      });
    },
    {
      query: t.Object({
        date: t.String({ format: 'date' }),
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        cashierUserId: t.Optional(UUID),
        cashierType: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanGetCashierPerformanceReport,
          PermissionKeys.CanReadAccounting,
        ),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Daily cashier sales report by session and payment mode',
        operationId: 'getDailyCashierSalesReport',
      },
    },
  )
  .get(
    '/daily-cash-confirmations',
    async ({ user, query }) =>
      getDailyCashConfirmationReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        from: query.from,
        to: query.to,
        status: query.status ?? null,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('accounting'),
        requirePermissions(PermissionKeys.CanReadAccounting),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Daily cash confirmations report',
        operationId: 'getDailyCashConfirmationReport',
      },
    },
  )
  .get(
    '/expense-by-category',
    async ({ user, query }) =>
      getExpenseByCategoryReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        from: query.from,
        to: query.to,
        status: query.status ?? null,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('accounting'),
        requirePermissions(PermissionKeys.CanReadAccounting),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Expense by category report',
        operationId: 'getExpenseByCategoryReport',
      },
    },
  )
  .get(
    '/payroll-journal-reconciliation',
    async ({ user, query }) =>
      getPayrollJournalReconciliationReportSvc({
        companyId: user!.companyId!,
        payrollCycleId: query.payrollCycleId,
      }),
    {
      query: t.Object({
        payrollCycleId: UUID,
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('payroll'),
        requireModuleEnabled('accounting'),
        requirePermissions(PermissionKeys.CanReadAccounting, PermissionKeys.CanReadPayrollRun),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Payroll journal reconciliation report',
        operationId: 'getPayrollJournalReconciliationReport',
      },
    },
  )
  .get(
    '/delivery-performance',
    async ({ user, query }) =>
      getDeliveryPerformanceReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        riderUserId: query.riderUserId ?? null,
        from: query.from,
        to: query.to,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        riderUserId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetParcelStatusSummaryReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Delivery performance report',
        operationId: 'getDeliveryPerformanceReport',
      },
    },
  )
  .get(
    '/employees',
    async ({ user, query }) =>
      getEmployeeMasterReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        departmentId: query.departmentId ?? null,
        status: query.status ?? null,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        departmentId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('hr'),
        requirePermissions(PermissionKeys.CanListEmployees),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Employee master report',
        operationId: 'getEmployeeMasterReport',
      },
    },
  )
  .get(
    '/attendance',
    async ({ user, query }) =>
      getAttendanceReportSvc({
        companyId: user!.companyId!,
        from: query.from,
        to: query.to,
        employeeId: query.employeeId ?? null,
        branchId: query.branchId ?? null,
      }),
    {
      query: t.Object({
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
        employeeId: t.Optional(UUID),
        branchId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('hr'),
        requirePermissions(PermissionKeys.CanListAttendance),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Attendance report',
        operationId: 'getAttendanceReport',
      },
    },
  )
  .get(
    '/leave-requests',
    async ({ user, query }) =>
      getLeaveRequestsReportSvc({
        companyId: user!.companyId!,
        from: query.from,
        to: query.to,
        employeeId: query.employeeId ?? null,
        status: query.status ?? null,
      }),
    {
      query: t.Object({
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
        employeeId: t.Optional(UUID),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('hr'),
        requirePermissions(PermissionKeys.CanListLeaveRequests),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Leave requests report',
        operationId: 'getLeaveRequestsReport',
      },
    },
  )
  .get(
    '/payroll-register',
    async ({ user, query }) =>
      getPayrollRegisterReportSvc({
        companyId: user!.companyId!,
        payrollCycleId: query.payrollCycleId,
      }),
    {
      query: t.Object({
        payrollCycleId: UUID,
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('payroll'),
        requirePermissions(PermissionKeys.CanReadPayrollRun),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Payroll register report',
        operationId: 'getPayrollRegisterReport',
      },
    },
  )
  .get(
    '/payroll-overtime',
    async ({ user, query }) =>
      getPayrollOvertimeReportSvc({
        companyId: user!.companyId!,
        payrollCycleId: query.payrollCycleId,
      }),
    {
      query: t.Object({
        payrollCycleId: UUID,
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('payroll'),
        requirePermissions(PermissionKeys.CanReadPayrollInputs),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Payroll overtime report',
        operationId: 'getPayrollOvertimeReport',
      },
    },
  )
  .get(
    '/payroll-adjustments',
    async ({ user, query }) =>
      getPayrollAdjustmentsReportSvc({
        companyId: user!.companyId!,
        payrollCycleId: query.payrollCycleId,
      }),
    {
      query: t.Object({
        payrollCycleId: UUID,
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('payroll'),
        requirePermissions(PermissionKeys.CanReadPayrollInputs),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Payroll manual adjustments report',
        operationId: 'getPayrollAdjustmentsReport',
      },
    },
  )
  .get(
    '/cashier-performance',
    async ({ user, query }) => {
      return getCashierDaySessionsReportSvc({
        companyId: user!.companyId!,
        cashierId: query.cashierId,
        branchId: query.branchId ?? null,
        date: query.date,
        includeTransactions: query.includeTransactions ?? true,
      });
    },
    {
      query: t.Object({
        cashierId: UUID,
        branchId: t.Optional(UUID),
        date: t.String({ format: 'date' }),
        includeTransactions: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetCashierPerformanceReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Cashier day sessions with transaction details',
        operationId: 'getCashierPerformanceReport',
      },
    },
  )
  .get(
    '/shift-revenue',
    async ({ user, query }) =>
      getShiftRevenueReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        shiftSessionId: query.shiftSessionId ?? null,
        from: query.from,
        to: query.to,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        shiftSessionId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanGetShiftRevenueReport)],
      detail: {
        tags: ['Reporting'],
        summary: 'Shift revenue report',
        operationId: 'getShiftRevenueReport',
      },
    },
  )
  .get(
    '/branch-profitability',
    async ({ user, query }) =>
      getBranchProfitabilityReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        from: query.from,
        to: query.to,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        from: t.String({ format: 'date' }),
        to: t.String({ format: 'date' }),
      }),
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('accounting'),
        requirePermissions(PermissionKeys.CanGetBranchProfitabilityReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Branch profitability report',
        operationId: 'getBranchProfitabilityReport',
      },
    },
  )
  .get(
    '/credit-exposure',
    async ({ user, query }) =>
      getCreditExposureReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        agingBucket: query.agingBucket ?? null,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        agingBucket: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanGetCreditExposureReport)],
      detail: {
        tags: ['Reporting'],
        summary: 'Credit exposure report',
        operationId: 'getCreditExposureReport',
      },
    },
  )
  .get(
    '/customer-credit-aging-detail',
    async ({ user, query }) =>
      getCustomerCreditAgingDetailReportSvc({
        companyId: user!.companyId!,
        customerId: query.customerId ?? null,
        agingBucket: query.agingBucket ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
      }),
    {
      query: t.Object({
        customerId: t.Optional(UUID),
        agingBucket: t.Optional(t.String()),
        from: t.Optional(t.String({ format: 'date' })),
        to: t.Optional(t.String({ format: 'date' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanGetCreditExposureReport)],
      detail: {
        tags: ['Reporting'],
        summary: 'Customer credit aging detail report',
        operationId: 'getCustomerCreditAgingDetailReport',
      },
    },
  )
  .get(
    '/tobepaid-outstanding',
    async ({ user, query }) =>
      getOutstandingToBePaidReportSvc({
        companyId: user!.companyId!,
        sourceBranchId: query.sourceBranchId ?? null,
        destinationBranchId: query.destinationBranchId ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
      }),
    {
      query: t.Object({
        sourceBranchId: t.Optional(UUID),
        destinationBranchId: t.Optional(UUID),
        from: t.Optional(t.String({ format: 'date' })),
        to: t.Optional(t.String({ format: 'date' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetOutstandingToBePaidReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Outstanding to-be-paid report',
        operationId: 'getOutstandingToBePaidReport',
      },
    },
  )
  .get(
    '/tobepaid-collections-reconciliation',
    async ({ user, query }) =>
      getToBePaidCollectionsReconciliationReportSvc({
        companyId: user!.companyId!,
        sourceBranchId: query.sourceBranchId ?? null,
        destinationBranchId: query.destinationBranchId ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
      }),
    {
      query: t.Object({
        sourceBranchId: t.Optional(UUID),
        destinationBranchId: t.Optional(UUID),
        from: t.Optional(t.String({ format: 'date' })),
        to: t.Optional(t.String({ format: 'date' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetOutstandingToBePaidReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'To-be-paid collections reconciliation report',
        operationId: 'getToBePaidCollectionsReconciliationReport',
      },
    },
  )
  .get(
    '/parcel-status-summary',
    async ({ user, query }) =>
      getParcelStatusSummaryReportSvc({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        from: t.Optional(t.String({ format: 'date' })),
        to: t.Optional(t.String({ format: 'date' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetParcelStatusSummaryReport),
      ],
      detail: {
        tags: ['Reporting'],
        summary: 'Parcel status summary report',
        operationId: 'getParcelStatusSummaryReport',
      },
    },
  );
