export type AccountingRouteReportKey =
  | 'trial-balance'
  | 'account-statement'
  | 'income-statement'
  | 'profit-loss'
  | 'balance-sheet'
  | 'cash-flow'
  | 'monthly-branch-summary'
  | 'general-ledger'
  | 'journal-listing'
  | 'account-activity';

export type ReportMeta = {
  title: string;
  description: string;
  exportFile: string;
};

export type AccountingReportFilters = {
  branchId: string;
  locationId: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
};

export const REPORT_META: Record<AccountingRouteReportKey, ReportMeta> = {
  'trial-balance': {
    title: 'Trial Balance',
    description: 'Review debit and credit totals by account across the selected filters.',
    exportFile: 'trial-balance.csv',
  },
  'account-statement': {
    title: 'Account Statement',
    description: 'Select an account to review the running ledger statement for the period.',
    exportFile: 'account-statement.csv',
  },
  'income-statement': {
    title: 'Income Statement',
    description: 'Compare income and expense lines with summarized totals.',
    exportFile: 'income-statement.csv',
  },
  'profit-loss': {
    title: 'Profit & Loss',
    description: 'Review revenue, expenses, and net profit for the selected period.',
    exportFile: 'profit-loss.csv',
  },
  'balance-sheet': {
    title: 'Balance Sheet',
    description: 'Track assets, liabilities, and equity at the selected date.',
    exportFile: 'balance-sheet.csv',
  },
  'cash-flow': {
    title: 'Cash Flow',
    description: 'Review operating, investing, and financing cash movement.',
    exportFile: 'cash-flow.csv',
  },
  'monthly-branch-summary': {
    title: 'Monthly Branch Summary',
    description: 'Compare income, expenses, and net values across branches.',
    exportFile: 'monthly-branch-summary.csv',
  },
  'general-ledger': {
    title: 'General Ledger',
    description: 'Inspect running ledger entries for a selected account over time.',
    exportFile: 'general-ledger.csv',
  },
  'journal-listing': {
    title: 'Journal Listing',
    description: 'Inspect posted ledger journal lines for a selected account over time.',
    exportFile: 'journal-listing.csv',
  },
  'account-activity': {
    title: 'Account Activity',
    description: 'Track account-level movement and running balances over time.',
    exportFile: 'account-activity.csv',
  },
};
