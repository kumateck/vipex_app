import {
  getBranchProfitabilityReportSvc,
  getDeliveryPerformanceReportSvc,
  getExpenseByCategoryReportSvc,
} from '@/server/features/reporting/service';
import type { AiChatTool } from './types';

type FromToArgs = { branchId?: string | null; from: string; to: string };

const fromToSchema = {
  type: 'object',
  properties: {
    branchId: {
      type: 'string',
      description: 'Optional branch id to scope the figures to a single branch.',
    },
    from: { type: 'string', description: 'Start date, ISO format (YYYY-MM-DD).' },
    to: { type: 'string', description: 'End date, ISO format (YYYY-MM-DD).' },
  },
  required: ['from', 'to'],
};

function toGhs(psw: number | null | undefined): number {
  return Math.round(((psw ?? 0) / 100) * 100) / 100;
}

export const getBranchProfitabilityTool: AiChatTool<FromToArgs> = {
  name: 'get_branch_profitability',
  description:
    'Returns income, expense, and net profit broken down per branch for a date range. Use this to compare branches or find the best/worst performing branch.',
  inputSchema: fromToSchema,
  defaultChartType: 'bar',
  async handler(args, scope) {
    return getBranchProfitabilityReportSvc({
      companyId: scope.companyId,
      branchId: args.branchId ?? null,
      from: args.from,
      to: args.to,
    });
  },
  toChartPoints(raw) {
    const rows = (raw as { rows?: { branchName: string; netProfitPsw: number }[] })?.rows ?? [];
    return rows.map((row) => ({
      label: row.branchName,
      value: Math.round(row.netProfitPsw / 100),
    }));
  },
  toLlmSummary(raw) {
    const data = raw as {
      totals?: { branches: number; incomePsw: number; expensePsw: number; netProfitPsw: number };
      rows?: { branchName: string; incomePsw: number; expensePsw: number; netProfitPsw: number }[];
    };
    return {
      currency: 'GHS',
      totalIncomeGhs: toGhs(data.totals?.incomePsw),
      totalExpenseGhs: toGhs(data.totals?.expensePsw),
      totalNetProfitGhs: toGhs(data.totals?.netProfitPsw),
      branches: (data.rows ?? []).map((row) => ({
        branchName: row.branchName,
        incomeGhs: toGhs(row.incomePsw),
        expenseGhs: toGhs(row.expensePsw),
        netProfitGhs: toGhs(row.netProfitPsw),
      })),
    };
  },
};

export const getDeliveryPerformanceTool: AiChatTool<FromToArgs & { riderUserId?: string | null }> =
  {
    name: 'get_delivery_performance',
    description:
      'Returns delivery counts broken down by status (delivered, returned to office, out for delivery) for a date range. Use this for operational/delivery performance questions.',
    inputSchema: {
      type: 'object',
      properties: {
        ...fromToSchema.properties,
        riderUserId: {
          type: 'string',
          description: 'Optional rider user id to scope to a single rider.',
        },
      },
      required: ['from', 'to'],
    },
    defaultChartType: 'bar',
    async handler(args, scope) {
      return getDeliveryPerformanceReportSvc({
        companyId: scope.companyId,
        branchId: args.branchId ?? null,
        riderUserId: args.riderUserId ?? null,
        from: args.from,
        to: args.to,
      });
    },
    toChartPoints(raw) {
      const statusSummary =
        (raw as { statusSummary?: { status: string; count: number }[] })?.statusSummary ?? [];
      return statusSummary.map((row) => ({ label: row.status, value: row.count }));
    },
    toLlmSummary(raw) {
      const data = raw as {
        totals?: {
          deliveries: number;
          delivered: number;
          returnedToOffice: number;
          outForDelivery: number;
          deliveryFeesPsw: number;
          amountPaidPsw: number;
        };
        statusSummary?: { status: string; count: number }[];
      };
      return {
        currency: 'GHS',
        totalDeliveries: data.totals?.deliveries ?? 0,
        delivered: data.totals?.delivered ?? 0,
        returnedToOffice: data.totals?.returnedToOffice ?? 0,
        outForDelivery: data.totals?.outForDelivery ?? 0,
        deliveryFeesGhs: toGhs(data.totals?.deliveryFeesPsw),
        amountPaidGhs: toGhs(data.totals?.amountPaidPsw),
        statusSummary: data.statusSummary ?? [],
      };
    },
  };

export const getExpenseByCategoryTool: AiChatTool<FromToArgs & { status?: number | null }> = {
  name: 'get_expense_by_category',
  description:
    'Returns total expense amounts broken down by expense category for a date range. Use this for questions about where money is being spent.',
  inputSchema: fromToSchema,
  defaultChartType: 'donut',
  async handler(args, scope) {
    return getExpenseByCategoryReportSvc({
      companyId: scope.companyId,
      branchId: args.branchId ?? null,
      from: args.from,
      to: args.to,
      status: args.status ?? null,
    });
  },
  toChartPoints(raw) {
    const summaryRows =
      (raw as { summaryRows?: { expenseCategoryName: string; totalAmountPsw: number }[] })
        ?.summaryRows ?? [];
    return summaryRows.map((row) => ({
      label: row.expenseCategoryName,
      value: Math.round(row.totalAmountPsw / 100),
    }));
  },
  toLlmSummary(raw) {
    const data = raw as {
      totals?: { categories: number; totalAmountPsw: number };
      summaryRows?: { expenseCategoryName: string; totalAmountPsw: number }[];
    };
    return {
      currency: 'GHS',
      totalExpenseGhs: toGhs(data.totals?.totalAmountPsw),
      categories: (data.summaryRows ?? []).map((row) => ({
        category: row.expenseCategoryName,
        amountGhs: toGhs(row.totalAmountPsw),
      })),
    };
  },
};
