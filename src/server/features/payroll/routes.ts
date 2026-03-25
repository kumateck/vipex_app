import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  approvePayrollCycleCtrl,
  approvePayrollManualAdjustmentCtrl,
  approvePayrollOvertimeEntryCtrl,
  createPayrollManualAdjustmentCtrl,
  createDeductionTypeCtrl,
  createEarningTypeCtrl,
  createPayrollOvertimeEntryCtrl,
  createPayrollGroupCtrl,
  createPayrollCycleCtrl,
  getPayrollBankExportCtrl,
  getPayslipDetailCtrl,
  getEmployeeCompensationCtrl,
  journalizePayrollCycleCtrl,
  listCompensationCtrl,
  listDeductionTypesCtrl,
  listEarningTypesCtrl,
  listPayrollManualAdjustmentsCtrl,
  listPayrollGroupsCtrl,
  listPayrollCyclesCtrl,
  listPayrollOvertimeEntriesCtrl,
  listPayslipsCtrl,
  reopenPayrollCycleCtrl,
  rejectPayrollManualAdjustmentCtrl,
  rejectPayrollOvertimeEntryCtrl,
  reversePayrollCycleCtrl,
  runPayrollCycleCtrl,
  setEmployeeCompensationCtrl,
  updateDeductionTypeCtrl,
  updateEarningTypeCtrl,
  updatePayrollGroupCtrl,
} from './controller';

export const payrollRoutes = new Elysia({ name: 'payroll' })
  .use(authPlugin)
  .get(
    '/groups',
    async ({ query, user }) =>
      listPayrollGroupsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadPayrollGroups),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'List payroll groups',
        operationId: 'listPayrollGroups',
      },
    },
  )
  .post(
    '/groups',
    async ({ body, set, user }) => {
      const result = await createPayrollGroupCtrl({
        companyId: (user as AuthUser).companyId!,
        name: body.name,
        payFrequency: body.payFrequency,
        currencyCode: body.currencyCode ?? 'GHS',
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        payFrequency: t.Number(),
        currencyCode: t.Optional(t.String({ minLength: 1, maxLength: 10 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreatePayrollGroups),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create payroll group',
        operationId: 'createPayrollGroup',
      },
    },
  )
  .get(
    '/earning-types',
    async ({ query, user }) =>
      listEarningTypesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: { tags: ['Payroll'], summary: 'List earning types', operationId: 'listEarningTypes' },
    },
  )
  .post(
    '/earning-types',
    async ({ body, set, user }) => {
      const result = await createEarningTypeCtrl({
        companyId: (user as AuthUser).companyId!,
        code: body.code,
        name: body.name,
        isTaxable: body.isTaxable ?? true,
        isRecurring: body.isRecurring ?? true,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 50 }),
        name: t.String({ minLength: 1, maxLength: 255 }),
        isTaxable: t.Optional(t.Boolean()),
        isRecurring: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create earning type',
        operationId: 'createEarningType',
      },
    },
  )
  .patch(
    '/earning-types/:id',
    async ({ params, body, user }) =>
      updateEarningTypeCtrl(params.id, (user as AuthUser).companyId!, {
        code: body.code,
        name: body.name,
        isTaxable: body.isTaxable,
        isRecurring: body.isRecurring,
        isActive: body.isActive,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        code: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        isTaxable: t.Optional(t.Boolean()),
        isRecurring: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Update earning type',
        operationId: 'updateEarningType',
      },
    },
  )
  .get(
    '/deduction-types',
    async ({ query, user }) =>
      listDeductionTypesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          includeInactive: query.includeInactive ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        includeInactive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'List deduction types',
        operationId: 'listDeductionTypes',
      },
    },
  )
  .post(
    '/deduction-types',
    async ({ body, set, user }) => {
      const result = await createDeductionTypeCtrl({
        companyId: (user as AuthUser).companyId!,
        code: body.code,
        name: body.name,
        isStatutory: body.isStatutory ?? false,
        isRecurring: body.isRecurring ?? true,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 50 }),
        name: t.String({ minLength: 1, maxLength: 255 }),
        isStatutory: t.Optional(t.Boolean()),
        isRecurring: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create deduction type',
        operationId: 'createDeductionType',
      },
    },
  )
  .patch(
    '/deduction-types/:id',
    async ({ params, body, user }) =>
      updateDeductionTypeCtrl(params.id, (user as AuthUser).companyId!, {
        code: body.code,
        name: body.name,
        isStatutory: body.isStatutory,
        isRecurring: body.isRecurring,
        isActive: body.isActive,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        code: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        isStatutory: t.Optional(t.Boolean()),
        isRecurring: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Update deduction type',
        operationId: 'updateDeductionType',
      },
    },
  )
  .get(
    '/compensation',
    async ({ query, user }) =>
      listCompensationCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          employeeId: query.employeeId ?? null,
          payrollGroupId: query.payrollGroupId ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        employeeId: t.Optional(UUID),
        payrollGroupId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: { tags: ['Payroll'], summary: 'List compensation', operationId: 'listCompensation' },
    },
  )
  .get(
    '/compensation/:employeeId',
    async ({ params, user }) =>
      getEmployeeCompensationCtrl(params.employeeId, (user as AuthUser).companyId!),
    {
      params: t.Object({ employeeId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Get employee compensation',
        operationId: 'getEmployeeCompensation',
      },
    },
  )
  .put(
    '/compensation/:employeeId',
    async ({ params, body, user }) => {
      return setEmployeeCompensationCtrl({
        companyId: (user as AuthUser).companyId!,
        employeeId: params.employeeId,
        payrollGroupId: body.payrollGroupId,
        payType: body.payType,
        currencyCode: body.currencyCode ?? null,
        basePayPsw: body.basePayPsw,
        effectiveFrom: new Date(body.effectiveFrom),
        taxProfileId: body.taxProfileId ?? null,
        createdBy: (user as AuthUser).sub,
        items: (body.items ?? []).map((item) => ({
          itemType: item.itemType,
          earningTypeId: item.earningTypeId ?? null,
          deductionTypeId: item.deductionTypeId ?? null,
          calculationType: item.calculationType,
          amountPsw: item.amountPsw,
          percentageBasis: item.percentageBasis ?? null,
          isRecurring: item.isRecurring ?? true,
          effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom) : null,
          effectiveTo: item.effectiveTo ? new Date(item.effectiveTo) : null,
        })),
      });
    },
    {
      params: t.Object({ employeeId: UUID }),
      body: t.Object({
        payrollGroupId: UUID,
        payType: t.Number(),
        currencyCode: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 10 }), t.Null()])),
        basePayPsw: t.Number(),
        effectiveFrom: t.String({ format: 'date' }),
        taxProfileId: t.Optional(t.Union([UUID, t.Null()])),
        items: t.Optional(
          t.Array(
            t.Object({
              itemType: t.Number(),
              earningTypeId: t.Optional(t.Union([UUID, t.Null()])),
              deductionTypeId: t.Optional(t.Union([UUID, t.Null()])),
              calculationType: t.Number(),
              amountPsw: t.Number(),
              percentageBasis: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
              isRecurring: t.Optional(t.Boolean()),
              effectiveFrom: t.Optional(t.Union([t.String({ format: 'date' }), t.Null()])),
              effectiveTo: t.Optional(t.Union([t.String({ format: 'date' }), t.Null()])),
            }),
          ),
        ),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompensation),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Set employee compensation',
        operationId: 'setEmployeeCompensation',
      },
    },
  )
  .patch(
    '/groups/:id',
    async ({ params, body, user }) =>
      updatePayrollGroupCtrl(params.id, (user as AuthUser).companyId!, {
        name: body.name,
        payFrequency: body.payFrequency,
        currencyCode: body.currencyCode,
        isActive: body.isActive,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        payFrequency: t.Optional(t.Number()),
        currencyCode: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 10 }), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreatePayrollGroups),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Update payroll group',
        operationId: 'updatePayrollGroup',
      },
    },
  )
  .get(
    '/cycles',
    async ({ query, user }) => {
      return listPayrollCyclesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          branchId: query.branchId ?? null,
          status: query.status ?? null,
        },
      });
    },
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        branchId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        month: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
        year: t.Optional(t.Number({ minimum: 2020, maximum: 2100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanListPayrollCycles),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'List payroll cycles',
        operationId: 'listPayrollCycles',
      },
    },
  )
  .post(
    '/cycles',
    async ({ body, set, user }) => {
      const result = await createPayrollCycleCtrl({
        companyId: (user as AuthUser).companyId!,
        payrollGroupId: body.payrollGroupId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        payrollGroupId: UUID,
        periodStart: t.String({ format: 'date' }),
        periodEnd: t.String({ format: 'date' }),
        paymentDate: t.Optional(t.String({ format: 'date' })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreatePayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create payroll cycle',
        operationId: 'createPayrollCycle',
      },
    },
  )
  .get(
    '/cycles/:id/overtime',
    async ({ params, user }) =>
      listPayrollOvertimeEntriesCtrl(params.id, (user as AuthUser).companyId!),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'List payroll overtime entries',
        operationId: 'listPayrollOvertimeEntries',
      },
    },
  )
  .post(
    '/cycles/:id/overtime',
    async ({ params, body, set, user }) => {
      const result = await createPayrollOvertimeEntryCtrl({
        payrollCycleId: params.id,
        companyId: (user as AuthUser).companyId!,
        employeeId: body.employeeId,
        overtimeMinutes: body.overtimeMinutes,
        ratePerHourPsw: body.ratePerHourPsw,
        multiplierPct: body.multiplierPct ?? 100,
        notes: body.notes ?? null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        employeeId: UUID,
        overtimeMinutes: t.Number({ minimum: 1 }),
        ratePerHourPsw: t.Number({ minimum: 1 }),
        multiplierPct: t.Optional(t.Number({ minimum: 1 })),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManagePayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create payroll overtime entry',
        operationId: 'createPayrollOvertimeEntry',
      },
    },
  )
  .post(
    '/cycles/:id/overtime/:entryId/approve',
    async ({ params, user }) =>
      approvePayrollOvertimeEntryCtrl(params.id, params.entryId, (user as AuthUser).sub),
    {
      params: t.Object({ id: UUID, entryId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Approve payroll overtime entry',
        operationId: 'approvePayrollOvertimeEntry',
      },
    },
  )
  .post(
    '/cycles/:id/overtime/:entryId/reject',
    async ({ params, body, user }) =>
      rejectPayrollOvertimeEntryCtrl(
        params.id,
        params.entryId,
        (user as AuthUser).sub,
        body.reason ?? null,
      ),
    {
      params: t.Object({ id: UUID, entryId: UUID }),
      body: t.Object({ reason: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Reject payroll overtime entry',
        operationId: 'rejectPayrollOvertimeEntry',
      },
    },
  )
  .get(
    '/cycles/:id/adjustments',
    async ({ params, user }) =>
      listPayrollManualAdjustmentsCtrl(params.id, (user as AuthUser).companyId!),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'List payroll manual adjustments',
        operationId: 'listPayrollManualAdjustments',
      },
    },
  )
  .post(
    '/cycles/:id/adjustments',
    async ({ params, body, set, user }) => {
      const result = await createPayrollManualAdjustmentCtrl({
        payrollCycleId: params.id,
        companyId: (user as AuthUser).companyId!,
        employeeId: body.employeeId,
        itemType: body.itemType,
        earningTypeId: body.earningTypeId ?? null,
        deductionTypeId: body.deductionTypeId ?? null,
        amountPsw: body.amountPsw,
        isTaxable: body.isTaxable ?? false,
        notes: body.notes ?? null,
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        employeeId: UUID,
        itemType: t.Number(),
        earningTypeId: t.Optional(t.Union([UUID, t.Null()])),
        deductionTypeId: t.Optional(t.Union([UUID, t.Null()])),
        amountPsw: t.Number({ minimum: 1 }),
        isTaxable: t.Optional(t.Boolean()),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManagePayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Create payroll manual adjustment',
        operationId: 'createPayrollManualAdjustment',
      },
    },
  )
  .post(
    '/cycles/:id/adjustments/:entryId/approve',
    async ({ params, user }) =>
      approvePayrollManualAdjustmentCtrl(params.id, params.entryId, (user as AuthUser).sub),
    {
      params: t.Object({ id: UUID, entryId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Approve payroll manual adjustment',
        operationId: 'approvePayrollManualAdjustment',
      },
    },
  )
  .post(
    '/cycles/:id/adjustments/:entryId/reject',
    async ({ params, body, user }) =>
      rejectPayrollManualAdjustmentCtrl(
        params.id,
        params.entryId,
        (user as AuthUser).sub,
        body.reason ?? null,
      ),
    {
      params: t.Object({ id: UUID, entryId: UUID }),
      body: t.Object({ reason: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveManagedPayrollInputs),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Reject payroll manual adjustment',
        operationId: 'rejectPayrollManualAdjustment',
      },
    },
  )
  .post(
    '/cycles/:id/run',
    async ({ params, user }) => {
      return runPayrollCycleCtrl(params.id, (user as AuthUser).sub);
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Optional(t.Object({ initiatedBy: t.Optional(UUID) })),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRunPayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: { tags: ['Payroll'], summary: 'Run payroll cycle', operationId: 'runPayrollCycle' },
    },
  )
  .post(
    '/cycles/:id/approve',
    async ({ params, body, user }) => {
      return approvePayrollCycleCtrl(params.id, (user as AuthUser).sub, body.comments ?? null);
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ approvedBy: t.Optional(UUID), comments: t.Optional(t.String()) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApprovePayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Approve payroll cycle',
        operationId: 'approvePayrollCycle',
      },
    },
  )
  .post(
    '/cycles/:id/reopen',
    async ({ params, user }) => {
      return reopenPayrollCycleCtrl(params.id, (user as AuthUser).sub);
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApprovePayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Reopen payroll cycle',
        operationId: 'reopenPayrollCycle',
      },
    },
  )
  .post(
    '/cycles/:id/reverse',
    async ({ params, user }) => {
      return reversePayrollCycleCtrl(params.id, (user as AuthUser).sub);
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanJournalizePayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Reverse payroll journal posting',
        operationId: 'reversePayrollCycle',
      },
    },
  )
  .get(
    '/cycles/:id/bank-export',
    async ({ params }) => {
      return getPayrollBankExportCtrl(params.id);
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadPayrollRun),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Get payroll bank export rows',
        operationId: 'getPayrollBankExport',
      },
    },
  )
  .get(
    '/cycles/:id/payslips',
    async ({ params, query }) => {
      return listPayslipsCtrl(params.id, {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          employeeId: query.employeeId ?? null,
        },
      });
    },
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        ...PaginationRequestQueryProps,
        employeeId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanListPayslips),
        requireModuleEnabled('payroll'),
      ],
      detail: { tags: ['Payroll'], summary: 'List payslips', operationId: 'listPayslips' },
    },
  )
  .get(
    '/payslips/:id',
    async ({ params }) => {
      return getPayslipDetailCtrl(params.id);
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanGetPayslip),
        requireModuleEnabled('payroll'),
      ],
      detail: { tags: ['Payroll'], summary: 'Get payslip detail', operationId: 'getPayslipDetail' },
    },
  )
  .post(
    '/cycles/:id/journalize',
    async ({ params, user }) => {
      return journalizePayrollCycleCtrl(params.id, (user as AuthUser).sub);
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Optional(t.Object({ postedBy: t.Optional(UUID) })),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanJournalizePayrollCycle),
        requireModuleEnabled('payroll'),
      ],
      detail: {
        tags: ['Payroll'],
        summary: 'Post payroll journal entries',
        operationId: 'journalizePayrollCycle',
      },
    },
  );
