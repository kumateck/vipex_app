import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import {
  type AccountStatementReport,
  type BalanceSheetReport,
  type CashFlowReport,
  type IncomeStatementReport,
  type MonthlyBranchSummaryReport,
  type TrialBalanceReport,
  useGetAccountStatementReportQuery,
  useGetBalanceSheetReportQuery,
  useGetCashFlowReportQuery,
  useGetIncomeStatementReportQuery,
  useGetMonthlyBranchSummaryReportQuery,
  useGetTrialBalanceReportQuery,
  useListAccountsQuery,
} from '../api';
import {
  AccountingDisabledState,
  DateRangeFields,
  formatMoney,
  todayDateInputValue,
} from './accounting-shared';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, rows: string[][]) {
  if (typeof window === 'undefined') return;
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function printHtml(
  title: string,
  sections: Array<{ heading: string; headers: string[]; rows: string[][] }>,
) {
  if (typeof window === 'undefined') return;
  const html = `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1 { margin-bottom: 24px; }
      h2 { margin-top: 32px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${sections
      .map(
        (section) => `
      <h2>${section.heading}</h2>
      <table>
        <thead>
          <tr>${section.headers.map((header) => `<th>${header}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${section.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>`,
      )
      .join('')}
  </body>
</html>`;
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function StatementLinesTable({
  rows,
}: {
  rows: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
}) {
  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Account' },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) => formatMoney(row.amountPsw),
      },
    ],
    [],
  );

  return (
    <DataTable
      mode="client"
      data={rows}
      columns={columns}
      showSearch
      searchPlaceholder="Search report lines"
      pageSizeOptions={[10, 20, 50]}
    />
  );
}

function SummaryCards(props: {
  income?: IncomeStatementReport | undefined;
  balance?: BalanceSheetReport | undefined;
  cash?: CashFlowReport | undefined;
}) {
  if (props.income) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Income</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.totalIncomePsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.totalExpensePsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.netProfitPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (props.balance) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Assets</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.assetsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Liabilities</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.liabilitiesPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Equity</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.equityPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (props.cash) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Operating Inflows</CardDescription>
            <CardTitle>{formatMoney(props.cash.operating.inflowsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Operating Outflows</CardDescription>
            <CardTitle>{formatMoney(props.cash.operating.outflowsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Investing Net</CardDescription>
            <CardTitle>{formatMoney(props.cash.investing.netPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Change In Cash</CardDescription>
            <CardTitle>{formatMoney(props.cash.totals.netChangeInCashPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
}

export function AccountingReportsPage() {
  const user = useAuthStore((state) => state.user);
  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  return <AccountingReportsPageContent user={user} />;
}

function AccountingReportsPageContent({ user }: { user: AuthUser }) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';

  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [accountId, setAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState(todayDateInputValue());
  const [dateTo, setDateTo] = useState(todayDateInputValue());
  const [activeTab, setActiveTab] = useState('trial-balance');

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId },
  );
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    companyId && branchId ? { companyId, branchId } : undefined,
    { skip: !companyId || !branchId },
  );
  const { data: accounts = [] } = useListAccountsQuery(
    { companyId, active: true },
    { skip: !companyId },
  );

  const commonParams = {
    companyId,
    branchId: branchId || undefined,
    locationId: locationId || undefined,
  };

  const trialBalance = useGetTrialBalanceReportQuery(
    {
      ...commonParams,
      dateFrom,
      dateTo,
    },
    { skip: !companyId || activeTab !== 'trial-balance' },
  );
  const incomeStatement = useGetIncomeStatementReportQuery(
    {
      ...commonParams,
      dateFrom,
      dateTo,
    },
    { skip: !companyId || activeTab !== 'income-statement' },
  );
  const balanceSheet = useGetBalanceSheetReportQuery(
    {
      ...commonParams,
      dateTo,
    },
    { skip: !companyId || activeTab !== 'balance-sheet' },
  );
  const cashFlow = useGetCashFlowReportQuery(
    {
      ...commonParams,
      dateFrom,
      dateTo,
    },
    { skip: !companyId || activeTab !== 'cash-flow' },
  );
  const monthlyBranchSummary = useGetMonthlyBranchSummaryReportQuery(
    {
      ...commonParams,
      dateFrom,
      dateTo,
    },
    { skip: !companyId || activeTab !== 'monthly-branch-summary' },
  );
  const accountStatement = useGetAccountStatementReportQuery(
    {
      ...commonParams,
      accountId,
      dateFrom,
      dateTo,
    },
    { skip: !companyId || !accountId || activeTab !== 'account-statement' },
  );

  const trialBalanceColumns = useMemo<ColumnDef<TrialBalanceReport['rows'][number]>[]>(
    () => [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Account' },
      {
        id: 'debit',
        header: 'Debit',
        accessorFn: (row) => formatMoney(row.debitPsw),
      },
      {
        id: 'credit',
        header: 'Credit',
        accessorFn: (row) => formatMoney(row.creditPsw),
      },
    ],
    [],
  );

  const accountStatementColumns = useMemo<ColumnDef<AccountStatementReport['rows'][number]>[]>(
    () => [
      {
        accessorKey: 'entryDate',
        header: 'Date',
      },
      {
        accessorKey: 'memo',
        header: 'Memo',
      },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) => row.branchName ?? '-',
      },
      {
        id: 'location',
        header: 'Location',
        accessorFn: (row) => row.locationName ?? '-',
      },
      {
        id: 'debit',
        header: 'Debit',
        accessorFn: (row) => formatMoney(row.debitPsw),
      },
      {
        id: 'credit',
        header: 'Credit',
        accessorFn: (row) => formatMoney(row.creditPsw),
      },
      {
        id: 'runningBalance',
        header: 'Running Balance',
        accessorFn: (row) => formatMoney(row.runningBalancePsw),
      },
    ],
    [],
  );

  const monthlyColumns = useMemo<
    ColumnDef<
      | MonthlyBranchSummaryReport['incomeRows'][number]
      | MonthlyBranchSummaryReport['expenseRows'][number]
    >[]
  >(() => {
    const branchColumns: ColumnDef<
      | MonthlyBranchSummaryReport['incomeRows'][number]
      | MonthlyBranchSummaryReport['expenseRows'][number]
    >[] = (monthlyBranchSummary.data?.branches ?? []).map((branch) => ({
      id: branch.branchId,
      header: branch.branchName,
      accessorFn: (row) => formatMoney(row.branchAmounts[branch.branchId] ?? 0),
    }));

    return [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Description' },
      ...branchColumns,
      {
        id: 'total',
        header: 'Total',
        accessorFn: (row) => formatMoney(row.totalPsw),
      },
    ];
  }, [monthlyBranchSummary.data?.branches]);

  const exportConfig = useMemo(() => {
    if (activeTab === 'trial-balance') {
      const rows = trialBalance.data?.rows ?? [];
      return {
        filename: 'trial-balance.csv',
        title: 'Trial Balance',
        sections: [
          {
            heading: 'Trial Balance',
            headers: ['Code', 'Account', 'Debit', 'Credit'],
            rows: rows.map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.debitPsw),
              formatMoney(row.creditPsw),
            ]),
          },
        ],
      };
    }

    if (activeTab === 'income-statement') {
      return {
        filename: 'income-statement.csv',
        title: 'Income Statement',
        sections: [
          {
            heading: 'Income',
            headers: ['Code', 'Account', 'Amount'],
            rows: (incomeStatement.data?.income ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Expenses',
            headers: ['Code', 'Account', 'Amount'],
            rows: (incomeStatement.data?.expenses ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
        ],
      };
    }

    if (activeTab === 'balance-sheet') {
      return {
        filename: 'balance-sheet.csv',
        title: 'Balance Sheet',
        sections: [
          {
            heading: 'Assets',
            headers: ['Code', 'Account', 'Amount'],
            rows: (balanceSheet.data?.assets ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Liabilities',
            headers: ['Code', 'Account', 'Amount'],
            rows: (balanceSheet.data?.liabilities ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
          {
            heading: 'Equity',
            headers: ['Code', 'Account', 'Amount'],
            rows: (balanceSheet.data?.equity ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              formatMoney(row.amountPsw),
            ]),
          },
        ],
      };
    }

    if (activeTab === 'cash-flow') {
      return {
        filename: 'cash-flow.csv',
        title: 'Cash Flow',
        sections: [
          {
            heading: 'Cash Flow',
            headers: ['Section', 'Metric', 'Amount'],
            rows: [
              ['Operating', 'Inflows', formatMoney(cashFlow.data?.operating.inflowsPsw ?? 0)],
              ['Operating', 'Outflows', formatMoney(cashFlow.data?.operating.outflowsPsw ?? 0)],
              ['Operating', 'Net', formatMoney(cashFlow.data?.operating.netPsw ?? 0)],
              ['Investing', 'Net', formatMoney(cashFlow.data?.investing.netPsw ?? 0)],
              ['Financing', 'Net', formatMoney(cashFlow.data?.financing.netPsw ?? 0)],
              [
                'Totals',
                'Net Change In Cash',
                formatMoney(cashFlow.data?.totals.netChangeInCashPsw ?? 0),
              ],
            ],
          },
        ],
      };
    }

    if (activeTab === 'monthly-branch-summary') {
      const branches = monthlyBranchSummary.data?.branches ?? [];
      const headers = [
        'Code',
        'Description',
        ...branches.map((branch) => branch.branchName),
        'Total',
      ];
      return {
        filename: 'monthly-branch-summary.csv',
        title: 'Monthly Branch Summary',
        sections: [
          {
            heading: 'Income By Branch',
            headers,
            rows: (monthlyBranchSummary.data?.incomeRows ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              ...branches.map((branch) => formatMoney(row.branchAmounts[branch.branchId] ?? 0)),
              formatMoney(row.totalPsw),
            ]),
          },
          {
            heading: 'Expenses By Branch',
            headers,
            rows: (monthlyBranchSummary.data?.expenseRows ?? []).map((row) => [
              row.accountCode,
              row.accountName,
              ...branches.map((branch) => formatMoney(row.branchAmounts[branch.branchId] ?? 0)),
              formatMoney(row.totalPsw),
            ]),
          },
          {
            heading: 'Net By Branch',
            headers: ['Branch', 'Net'],
            rows: branches.map((branch) => [
              branch.branchName,
              formatMoney(monthlyBranchSummary.data?.totals.netByBranch[branch.branchId] ?? 0),
            ]),
          },
        ],
      };
    }

    return {
      filename: 'account-statement.csv',
      title: 'Account Statement',
      sections: [
        {
          heading: 'Account Statement',
          headers: ['Date', 'Memo', 'Branch', 'Location', 'Debit', 'Credit', 'Running Balance'],
          rows: (accountStatement.data?.rows ?? []).map((row) => [
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
  }, [
    accountStatement.data?.rows,
    activeTab,
    balanceSheet.data?.assets,
    balanceSheet.data?.equity,
    balanceSheet.data?.liabilities,
    cashFlow.data?.financing.netPsw,
    cashFlow.data?.investing.netPsw,
    cashFlow.data?.operating.inflowsPsw,
    cashFlow.data?.operating.netPsw,
    cashFlow.data?.operating.outflowsPsw,
    cashFlow.data?.totals.netChangeInCashPsw,
    incomeStatement.data?.expenses,
    incomeStatement.data?.income,
    monthlyBranchSummary.data?.branches,
    monthlyBranchSummary.data?.expenseRows,
    monthlyBranchSummary.data?.incomeRows,
    monthlyBranchSummary.data?.totals.netByBranch,
    trialBalance.data?.rows,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounting Reports</h1>
        <p className="text-sm text-muted-foreground">
          These reports are generated from posted journal lines, so they stay aligned with confirmed
          accounting activity rather than raw operational entries.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              exportConfig.filename,
              exportConfig.sections.flatMap((section, index) => {
                const rows = [section.headers, ...section.rows];
                return index === 0 ? rows : [[''], section.headers, ...section.rows];
              }),
            )
          }
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => printHtml(exportConfig.title, exportConfig.sections)}
        >
          Print Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Filter by branch, location, date range, and account where needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="reports-branch">Branch</Label>
              <Select
                value={branchId || 'all'}
                onValueChange={(value) => setBranchId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="reports-branch">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reports-location">Location</Label>
              <Select
                value={locationId || 'all'}
                onValueChange={(value) => setLocationId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="reports-location">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="reports-account">Account Statement Account</Label>
              <Select
                value={accountId || 'none'}
                onValueChange={(value) => setAccountId(value === 'none' ? '' : value)}
              >
                <SelectTrigger id="reports-account">
                  <SelectValue placeholder="Select an account for the statement tab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No account selected</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DateRangeFields
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList variant="line" className="flex flex-wrap">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="monthly-branch-summary">Branch Summary</TabsTrigger>
          <TabsTrigger value="account-statement">Account Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>
                Review debit and credit totals by account across the selected filters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={trialBalance.data?.rows ?? []}
                columns={trialBalanceColumns}
                loading={trialBalance.isFetching}
                showSearch
                searchPlaceholder="Search trial balance"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-4">
          <SummaryCards income={incomeStatement.data} />
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={incomeStatement.data?.income ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={incomeStatement.data?.expenses ?? []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <SummaryCards balance={balanceSheet.data} />
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={balanceSheet.data?.assets ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={balanceSheet.data?.liabilities ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={balanceSheet.data?.equity ?? []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <SummaryCards cash={cashFlow.data} />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Operating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Inflows</span>
                  <span>{formatMoney(cashFlow.data?.operating.inflowsPsw ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outflows</span>
                  <span>{formatMoney(cashFlow.data?.operating.outflowsPsw ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(cashFlow.data?.operating.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Investing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(cashFlow.data?.investing.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Financing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(cashFlow.data?.financing.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly-branch-summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Income</CardDescription>
                <CardTitle>
                  {formatMoney(monthlyBranchSummary.data?.totals.totalIncomePsw ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle>
                  {formatMoney(monthlyBranchSummary.data?.totals.totalExpensePsw ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Branches In View</CardDescription>
                <CardTitle>{monthlyBranchSummary.data?.branches.length ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income By Branch</CardTitle>
              <CardDescription>
                Same income account separated by branch, with totals on the right.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={monthlyBranchSummary.data?.incomeRows ?? []}
                columns={monthlyColumns}
                loading={monthlyBranchSummary.isFetching}
                showSearch
                searchPlaceholder="Search branch income summary"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses By Branch</CardTitle>
              <CardDescription>
                Same expense account separated by branch, with totals on the right.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={monthlyBranchSummary.data?.expenseRows ?? []}
                columns={monthlyColumns}
                loading={monthlyBranchSummary.isFetching}
                showSearch
                searchPlaceholder="Search branch expense summary"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net By Branch</CardTitle>
              <CardDescription>
                Quick management view of branch income less branch expenses for the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(monthlyBranchSummary.data?.branches ?? []).map((branch) => (
                <div key={branch.branchId} className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{branch.branchName}</div>
                  <div className="mt-2 text-xl font-semibold">
                    {formatMoney(
                      monthlyBranchSummary.data?.totals.netByBranch[branch.branchId] ?? 0,
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Statement</CardTitle>
              <CardDescription>
                Select an account above to review the running ledger statement for the chosen
                period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={accountStatement.data?.rows ?? []}
                columns={accountStatementColumns}
                loading={accountStatement.isFetching}
                showSearch
                searchPlaceholder="Search account statement"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
