import { useMemo } from 'react';
import { formatMoney } from '../../accounting-shared';
import { REPORT_META, type AccountingRouteReportKey } from '../types/accounting-report-route.types';

export function useReportExportConfig(props: {
  report: AccountingRouteReportKey;
  reportMode: AccountingRouteReportKey;
  trialBalanceRows: Array<{
    accountCode: string;
    accountName: string;
    debitPsw: number;
    creditPsw: number;
  }>;
  incomeRows: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  expenseRows: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  balanceAssets: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  balanceLiabilities: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  balanceEquity: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  cashFlow: {
    operating: { inflowsPsw: number; outflowsPsw: number; netPsw: number };
    investing: { netPsw: number };
    financing: { netPsw: number };
    totals: { netChangeInCashPsw: number };
  } | null;
  monthlyBranches: Array<{ branchId: string; branchName: string }>;
  monthlyIncomeRows: Array<{
    accountCode: string;
    accountName: string;
    branchAmounts: Record<string, number>;
    totalPsw: number;
  }>;
  monthlyExpenseRows: Array<{
    accountCode: string;
    accountName: string;
    branchAmounts: Record<string, number>;
    totalPsw: number;
  }>;
  accountStatementRows: Array<{
    entryDate: string;
    memo: string | null;
    branchName: string | null;
    locationName: string | null;
    debitPsw: number;
    creditPsw: number;
    runningBalancePsw: number;
  }>;
}) {
  return useMemo(() => {
    if (props.reportMode === 'trial-balance') {
      return {
        title: REPORT_META[props.report].title,
        filename: REPORT_META[props.report].exportFile,
        sections: [
          {
            heading: 'Trial Balance',
            headers: ['Code', 'Account', 'Debit', 'Credit'],
            rows: props.trialBalanceRows.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.debitPsw),
              formatMoney(row.creditPsw),
            ]),
          },
        ],
      };
    }

    if (props.reportMode === 'income-statement' || props.reportMode === 'profit-loss') {
      return {
        title: REPORT_META[props.report].title,
        filename: REPORT_META[props.report].exportFile,
        sections: [
          {
            heading: 'Income',
            headers: ['Code', 'Account', 'Amount'],
            rows: props.incomeRows.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Expenses',
            headers: ['Code', 'Account', 'Amount'],
            rows: props.expenseRows.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
        ],
      };
    }

    if (props.reportMode === 'balance-sheet') {
      return {
        title: REPORT_META[props.report].title,
        filename: REPORT_META[props.report].exportFile,
        sections: [
          {
            heading: 'Assets',
            headers: ['Code', 'Account', 'Amount'],
            rows: props.balanceAssets.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Liabilities',
            headers: ['Code', 'Account', 'Amount'],
            rows: props.balanceLiabilities.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Equity',
            headers: ['Code', 'Account', 'Amount'],
            rows: props.balanceEquity.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
        ],
      };
    }

    if (props.reportMode === 'cash-flow') {
      return {
        title: REPORT_META[props.report].title,
        filename: REPORT_META[props.report].exportFile,
        sections: [
          {
            heading: 'Cash Flow',
            headers: ['Section', 'Metric', 'Amount'],
            rows: [
              ['Operating', 'Inflows', formatMoney(props.cashFlow?.operating.inflowsPsw ?? 0)],
              ['Operating', 'Outflows', formatMoney(props.cashFlow?.operating.outflowsPsw ?? 0)],
              ['Operating', 'Net', formatMoney(props.cashFlow?.operating.netPsw ?? 0)],
              ['Investing', 'Net', formatMoney(props.cashFlow?.investing.netPsw ?? 0)],
              ['Financing', 'Net', formatMoney(props.cashFlow?.financing.netPsw ?? 0)],
              [
                'Totals',
                'Net Change In Cash',
                formatMoney(props.cashFlow?.totals.netChangeInCashPsw ?? 0),
              ],
            ],
          },
        ],
      };
    }

    if (props.reportMode === 'monthly-branch-summary') {
      const headers = [
        'Code',
        'Description',
        ...props.monthlyBranches.map((branch) => branch.branchName),
        'Total',
      ];

      return {
        title: REPORT_META[props.report].title,
        filename: REPORT_META[props.report].exportFile,
        sections: [
          {
            heading: 'Income By Branch',
            headers,
            rows: props.monthlyIncomeRows.map((row) => [
              row.accountCode,
              row.accountName,
              ...props.monthlyBranches.map((branch) =>
                formatMoney(row.branchAmounts[branch.branchId] ?? 0),
              ),
              formatMoney(row.totalPsw),
            ]),
          },
          {
            heading: 'Expenses By Branch',
            headers,
            rows: props.monthlyExpenseRows.map((row) => [
              row.accountCode,
              row.accountName,
              ...props.monthlyBranches.map((branch) =>
                formatMoney(row.branchAmounts[branch.branchId] ?? 0),
              ),
              formatMoney(row.totalPsw),
            ]),
          },
        ],
      };
    }

    return {
      title: REPORT_META[props.report].title,
      filename: REPORT_META[props.report].exportFile,
      sections: [
        {
          heading: 'Account Statement',
          headers: ['Date', 'Memo', 'Branch', 'Location', 'Debit', 'Credit', 'Running Balance'],
          rows: props.accountStatementRows.map((row) => [
            row.entryDate,
            row.memo ?? '',
            row.branchName ?? '',
            row.locationName ?? '',
            formatMoney(row.debitPsw),
            formatMoney(row.creditPsw),
            formatMoney(row.runningBalancePsw),
          ]),
        },
      ],
    };
  }, [props]);
}
