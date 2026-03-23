import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface PayrollGroup {
  id: string;
  companyId: string;
  name: string;
  payFrequency: number;
  currencyCode: string;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EarningType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isTaxable: boolean;
  isRecurring: boolean;
  isActive: boolean;
}

export interface DeductionType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isStatutory: boolean;
  isRecurring: boolean;
  isActive: boolean;
}

export interface CompensationItem {
  id?: string;
  employeeCompensationId?: string;
  itemType: number;
  earningTypeId?: string | null;
  deductionTypeId?: string | null;
  calculationType: number;
  amountPsw: number;
  percentageBasis?: string | null;
  isRecurring?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  earningCode?: string | null;
  earningName?: string | null;
  deductionCode?: string | null;
  deductionName?: string | null;
}

export interface EmployeeCompensation {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNumber?: string;
  employeeName?: string;
  payrollGroupId: string;
  payrollGroupName?: string | null;
  payType: number;
  currencyCode: string;
  basePayPsw: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
  items?: CompensationItem[];
}

export interface PayrollCycle {
  id: string;
  companyId: string;
  payrollGroupId: string;
  payrollGroupName?: string | null;
  name: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  paymentDate?: string | null;
  status: number;
  latestRunId?: string | null;
  latestRunStatus?: number | null;
  journalBatchId?: string | null;
  approvedAt?: string | null;
}

export interface Payslip {
  id: string;
  payrollRunEmployeeId: string;
  payslipNumber: string;
  issuedAt?: string | null;
  deliveryStatus?: string | null;
  employeeId: string;
  employeeName: string;
  netPayPsw: number;
}

export interface PayrollBankExportRow {
  payslipId?: string | null;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyNumber?: string | null;
  paymentMethod?: number | null;
  netPayPsw: number;
  currencyCode: string;
}

export interface PayrollBankExport {
  payrollCycleId: string;
  payrollCycleName: string;
  payrollRunId: string;
  rows: PayrollBankExportRow[];
}

export interface PayslipDetailItem {
  id: string;
  itemType: number;
  code: string;
  name: string;
  amountPsw: number;
  isTaxable: boolean;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PayslipDetail {
  id: string;
  companyId: string;
  payrollRunEmployeeId: string;
  payslipNumber: string;
  issuedAt?: string | null;
  deliveryStatus?: string | null;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  branchId?: string | null;
  departmentName?: string | null;
  jobTitleName?: string | null;
  basePayPsw: number;
  grossPayPsw: number;
  totalDeductionsPsw: number;
  netPayPsw: number;
  currencyCode: string;
  payrollRunId: string;
  payrollCycleId: string;
  payrollCycleName: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  paymentDate?: string | null;
  items: PayslipDetailItem[];
}

export const payrollApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listPayrollGroups: builder.query<
      ServerListResponse<PayrollGroup>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/payroll/groups',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    createPayrollGroup: builder.mutation<
      { id?: string },
      { name: string; payFrequency: number; currencyCode?: string }
    >({
      query: (body) => ({
        url: '/payroll/groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Payroll'),
    }),
    updatePayrollGroup: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          name?: string;
          payFrequency?: number;
          currencyCode?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/groups/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    listEarningTypes: builder.query<
      ServerListResponse<EarningType>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/payroll/earning-types',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    createEarningType: builder.mutation<
      { id?: string },
      { code: string; name: string; isTaxable?: boolean; isRecurring?: boolean }
    >({
      query: (body) => ({
        url: '/payroll/earning-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Payroll'),
    }),
    updateEarningType: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          code?: string;
          name?: string;
          isTaxable?: boolean;
          isRecurring?: boolean;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/earning-types/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    listDeductionTypes: builder.query<
      ServerListResponse<DeductionType>,
      ServerListQuery<{ includeInactive?: boolean | null }> | void
    >({
      query: (query) => ({
        url: '/payroll/deduction-types',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    createDeductionType: builder.mutation<
      { id?: string },
      { code: string; name: string; isStatutory?: boolean; isRecurring?: boolean }
    >({
      query: (body) => ({
        url: '/payroll/deduction-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Payroll'),
    }),
    updateDeductionType: builder.mutation<
      { id?: string },
      {
        id: string;
        body: {
          code?: string;
          name?: string;
          isStatutory?: boolean;
          isRecurring?: boolean;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/payroll/deduction-types/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    listCompensation: builder.query<
      ServerListResponse<EmployeeCompensation>,
      ServerListQuery<{ employeeId?: string | null; payrollGroupId?: string | null }> | void
    >({
      query: (query) => ({
        url: '/payroll/compensation',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    getEmployeeCompensation: builder.query<EmployeeCompensation | null, string>({
      query: (employeeId) => ({
        url: `/payroll/compensation/${employeeId}`,
      }),
      providesTags: (_result, _error, employeeId) => [
        { type: 'Payroll', id: `COMP-${employeeId}` },
      ],
    }),
    setEmployeeCompensation: builder.mutation<
      { id?: string },
      {
        employeeId: string;
        payrollGroupId: string;
        payType: number;
        currencyCode?: string | null;
        basePayPsw: number;
        effectiveFrom: string;
        taxProfileId?: string | null;
        items?: CompensationItem[];
      }
    >({
      query: ({ employeeId, ...body }) => ({
        url: `/payroll/compensation/${employeeId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: 'Payroll', id: `COMP-${employeeId}` },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    listPayrollCycles: builder.query<
      ServerListResponse<PayrollCycle>,
      ServerListQuery<{ branchId?: string | null; status?: number | null }> | void
    >({
      query: (query) => ({
        url: '/payroll/cycles',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    createPayrollCycle: builder.mutation<
      { id?: string },
      {
        payrollGroupId: string;
        periodStart: string;
        periodEnd: string;
        paymentDate?: string | null;
      }
    >({
      query: (body) => ({
        url: '/payroll/cycles',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Payroll'),
    }),
    runPayrollCycle: builder.mutation<{ id?: string; employeeCount?: number }, string>({
      query: (id) => ({
        url: `/payroll/cycles/${id}/run`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    approvePayrollCycle: builder.mutation<
      { id?: string },
      { id: string; comments?: string | null }
    >({
      query: ({ id, comments }) => ({
        url: `/payroll/cycles/${id}/approve`,
        method: 'POST',
        body: { comments: comments ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    journalizePayrollCycle: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/payroll/cycles/${id}/journalize`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    reopenPayrollCycle: builder.mutation<{ id?: string }, string>({
      query: (id) => ({
        url: `/payroll/cycles/${id}/reopen`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Payroll', id },
        ...invalidateEntityListTag('Payroll'),
      ],
    }),
    reversePayrollCycle: builder.mutation<{ id?: string; reversalJournalBatchId?: string }, string>(
      {
        query: (id) => ({
          url: `/payroll/cycles/${id}/reverse`,
          method: 'POST',
          body: {},
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Payroll', id },
          ...invalidateEntityListTag('Payroll'),
        ],
      },
    ),
    getPayrollBankExport: builder.query<PayrollBankExport, string>({
      query: (id) => ({
        url: `/payroll/cycles/${id}/bank-export`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payroll', id: `BANK-EXPORT-${id}` }],
    }),
    listPayslips: builder.query<
      ServerListResponse<Payslip>,
      { payrollCycleId: string; employeeId?: string | null; page?: number; pageSize?: number }
    >({
      query: ({ payrollCycleId, ...params }) => ({
        url: `/payroll/cycles/${payrollCycleId}/payslips`,
        params,
      }),
      providesTags: (result) => provideEntityListTags('Payroll', result),
    }),
    getPayslipDetail: builder.query<PayslipDetail, string>({
      query: (id) => ({
        url: `/payroll/payslips/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payroll', id: `PAYSLIP-${id}` }],
    }),
  }),
});

export const {
  useListPayrollGroupsQuery,
  useCreatePayrollGroupMutation,
  useUpdatePayrollGroupMutation,
  useListEarningTypesQuery,
  useCreateEarningTypeMutation,
  useUpdateEarningTypeMutation,
  useListDeductionTypesQuery,
  useCreateDeductionTypeMutation,
  useUpdateDeductionTypeMutation,
  useListCompensationQuery,
  useGetEmployeeCompensationQuery,
  useSetEmployeeCompensationMutation,
  useListPayrollCyclesQuery,
  useCreatePayrollCycleMutation,
  useRunPayrollCycleMutation,
  useApprovePayrollCycleMutation,
  useJournalizePayrollCycleMutation,
  useReopenPayrollCycleMutation,
  useReversePayrollCycleMutation,
  useGetPayrollBankExportQuery,
  useListPayslipsQuery,
  useGetPayslipDetailQuery,
} = payrollApi;
