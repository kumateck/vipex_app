import {
  getCashFlowStatementSvc,
  getIncomeStatementSvc,
} from '@/server/features/accounting/service';
import type { AiChatTool } from './types';

type DateRangeArgs = { branchId?: string | null; dateFrom: string; dateTo: string };

const dateRangeSchema = {
  type: 'object',
  properties: {
    branchId: {
      type: 'string',
      description: 'Optional branch id to scope the figures to a single branch.',
    },
    dateFrom: { type: 'string', description: 'Start date, ISO format (YYYY-MM-DD).' },
    dateTo: { type: 'string', description: 'End date, ISO format (YYYY-MM-DD).' },
  },
  required: ['dateFrom', 'dateTo'],
};

function toGhs(psw: number | null | undefined): number {
  return Math.round(((psw ?? 0) / 100) * 100) / 100;
}

export const getIncomeStatementTool: AiChatTool<DateRangeArgs> = {
  name: 'get_income_statement',
  description:
    'Returns total income, total expense, and net profit for a date range, optionally scoped to one branch. Use this for questions about revenue, expenses, or overall profitability.',
  inputSchema: dateRangeSchema,
  defaultChartType: 'none',
  async handler(args, scope) {
    return getIncomeStatementSvc({
      companyId: scope.companyId,
      branchId: args.branchId ?? null,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
    });
  },
  toChartPoints() {
    return [];
  },
  toLlmSummary(raw) {
    const totals = (
      raw as { totals?: { totalIncomePsw: number; totalExpensePsw: number; netProfitPsw: number } }
    )?.totals;
    return {
      currency: 'GHS',
      totalIncomeGhs: toGhs(totals?.totalIncomePsw),
      totalExpenseGhs: toGhs(totals?.totalExpensePsw),
      netProfitGhs: toGhs(totals?.netProfitPsw),
    };
  },
};

export const getCashFlowStatementTool: AiChatTool<DateRangeArgs> = {
  name: 'get_cash_flow_statement',
  description:
    'Returns operating, investing, and financing cash flow, plus net change in cash, for a date range. Use this for questions about cash position or liquidity.',
  inputSchema: dateRangeSchema,
  defaultChartType: 'none',
  async handler(args, scope) {
    return getCashFlowStatementSvc({
      companyId: scope.companyId,
      branchId: args.branchId ?? null,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
    });
  },
  toChartPoints() {
    return [];
  },
  toLlmSummary(raw) {
    const data = raw as {
      operating?: { inflowsPsw: number; outflowsPsw: number; netPsw: number };
      investing?: { netPsw: number };
      financing?: { netPsw: number };
      totals?: { netChangeInCashPsw: number };
    };
    return {
      currency: 'GHS',
      operatingInflowsGhs: toGhs(data.operating?.inflowsPsw),
      operatingOutflowsGhs: toGhs(data.operating?.outflowsPsw),
      operatingNetGhs: toGhs(data.operating?.netPsw),
      investingNetGhs: toGhs(data.investing?.netPsw),
      financingNetGhs: toGhs(data.financing?.netPsw),
      netChangeInCashGhs: toGhs(data.totals?.netChangeInCashPsw),
    };
  },
};
