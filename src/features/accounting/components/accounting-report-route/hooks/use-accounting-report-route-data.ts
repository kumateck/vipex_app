import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import {
  type AccountStatementReport,
  type MonthlyBranchSummaryReport,
  type TrialBalanceReport,
  useGetAccountStatementReportQuery,
  useGetBalanceSheetReportQuery,
  useGetCashFlowReportQuery,
  useGetIncomeStatementReportQuery,
  useGetMonthlyBranchSummaryReportQuery,
  useGetProfitLossReportQuery,
  useGetTrialBalanceReportQuery,
  useListAccountsQuery,
} from '../../../api';
import { formatMoney, todayDateInputValue } from '../../accounting-shared';
import {
  type AccountingReportFilters,
  type AccountingRouteReportKey,
} from '../types/accounting-report-route.types';

export function useAccountingReportRouteData({
  report,
  companyId,
  defaultBranchId,
  defaultLocationId,
}: {
  report: AccountingRouteReportKey;
  companyId: string;
  defaultBranchId: string;
  defaultLocationId: string;
}) {
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [accountId, setAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState(todayDateInputValue());
  const [dateTo, setDateTo] = useState(todayDateInputValue());
  const [appliedFilters, setAppliedFilters] = useState<AccountingReportFilters | null>(null);

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

  const hasPendingFilterChanges =
    !appliedFilters ||
    appliedFilters.branchId !== branchId ||
    appliedFilters.locationId !== locationId ||
    appliedFilters.accountId !== accountId ||
    appliedFilters.dateFrom !== dateFrom ||
    appliedFilters.dateTo !== dateTo;

  const commonParams = {
    companyId,
    branchId: appliedFilters?.branchId || undefined,
    locationId: appliedFilters?.locationId || undefined,
  };

  const reportMode: AccountingRouteReportKey =
    report === 'general-ledger' || report === 'journal-listing' || report === 'account-activity'
      ? 'account-statement'
      : report;

  const trialBalance = useGetTrialBalanceReportQuery(
    {
      ...commonParams,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters || reportMode !== 'trial-balance' },
  );

  const incomeStatement = useGetIncomeStatementReportQuery(
    {
      ...commonParams,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters || reportMode !== 'income-statement' },
  );

  const profitLoss = useGetProfitLossReportQuery(
    {
      ...commonParams,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters || reportMode !== 'profit-loss' },
  );

  const balanceSheet = useGetBalanceSheetReportQuery(
    { ...commonParams, dateTo: appliedFilters?.dateTo ?? dateTo },
    { skip: !companyId || !appliedFilters || reportMode !== 'balance-sheet' },
  );

  const cashFlow = useGetCashFlowReportQuery(
    {
      ...commonParams,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters || reportMode !== 'cash-flow' },
  );

  const monthlyBranchSummary = useGetMonthlyBranchSummaryReportQuery(
    {
      ...commonParams,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters || reportMode !== 'monthly-branch-summary' },
  );

  const accountStatement = useGetAccountStatementReportQuery(
    {
      ...commonParams,
      accountId: appliedFilters?.accountId ?? accountId,
      dateFrom: appliedFilters?.dateFrom ?? dateFrom,
      dateTo: appliedFilters?.dateTo ?? dateTo,
    },
    { skip: !companyId || !appliedFilters?.accountId || reportMode !== 'account-statement' },
  );

  const trialBalanceColumns = useMemo<ColumnDef<TrialBalanceReport['rows'][number]>[]>(
    () => [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Account' },
      { id: 'debit', header: 'Debit', accessorFn: (row) => formatMoney(row.debitPsw) },
      { id: 'credit', header: 'Credit', accessorFn: (row) => formatMoney(row.creditPsw) },
    ],
    [],
  );

  const accountStatementColumns = useMemo<ColumnDef<AccountStatementReport['rows'][number]>[]>(
    () => [
      { accessorKey: 'entryDate', header: 'Date' },
      { accessorKey: 'memo', header: 'Memo' },
      { id: 'branch', header: 'Branch', accessorFn: (row) => row.branchName ?? '-' },
      { id: 'location', header: 'Location', accessorFn: (row) => row.locationName ?? '-' },
      { id: 'debit', header: 'Debit', accessorFn: (row) => formatMoney(row.debitPsw) },
      { id: 'credit', header: 'Credit', accessorFn: (row) => formatMoney(row.creditPsw) },
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
    const branchColumns = (monthlyBranchSummary.data?.branches ?? []).map((branch) => ({
      id: branch.branchId,
      header: branch.branchName,
      accessorFn: (
        row:
          | MonthlyBranchSummaryReport['incomeRows'][number]
          | MonthlyBranchSummaryReport['expenseRows'][number],
      ) => formatMoney(row.branchAmounts[branch.branchId] ?? 0),
    }));

    return [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Description' },
      ...branchColumns,
      { id: 'total', header: 'Total', accessorFn: (row) => formatMoney(row.totalPsw) },
    ];
  }, [monthlyBranchSummary.data?.branches]);

  return {
    accountId,
    accountStatement,
    accountStatementColumns,
    accounts,
    appliedFilters,
    balanceSheet,
    branchId,
    branchOptions,
    cashFlow,
    dateFrom,
    dateTo,
    hasPendingFilterChanges,
    incomeStatement,
    locationId,
    locationOptions,
    monthlyBranchSummary,
    monthlyColumns,
    profitLoss,
    reportMode,
    trialBalance,
    trialBalanceColumns,
    setAccountId,
    setAppliedFilters,
    setBranchId,
    setDateFrom,
    setDateTo,
    setLocationId,
  };
}
