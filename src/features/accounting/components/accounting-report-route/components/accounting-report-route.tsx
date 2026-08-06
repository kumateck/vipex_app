import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import { useAccountingReportRouteData } from '../hooks/use-accounting-report-route-data';
import { useReportExportConfig } from '../hooks/use-report-export-config';
import { REPORT_META, type AccountingRouteReportKey } from '../types/accounting-report-route.types';
import { downloadCsv, printHtml } from '../utils/report-export';
import { ReportFiltersCard } from './report-filters-card';
import { ReportResults } from './report-results';

export function AccountingReportRoute({ report }: { report: AccountingRouteReportKey }) {
  const user = useAuthStore((state) => state.user);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!user.permissions?.includes(PermissionKeys.CanReadAccounting)) {
    return (
      <AccountingUnauthorizedState
        title="Accounting Reports Restricted"
        description="Your role does not include permission to view accounting reports and accounting master data."
      />
    );
  }

  const companyId = user.company?.id ?? '';
  const defaultBranchId = user.branch?.id ?? '';
  const defaultLocationId = user.location?.id ?? '';

  const data = useAccountingReportRouteData({
    report,
    companyId,
    defaultBranchId,
    defaultLocationId,
  });

  const incomeRows =
    data.reportMode === 'income-statement'
      ? (data.incomeStatement.data?.income ?? [])
      : (data.profitLoss.data?.income ?? []);
  const expenseRows =
    data.reportMode === 'income-statement'
      ? (data.incomeStatement.data?.expenses ?? [])
      : (data.profitLoss.data?.expenses ?? []);

  const exportConfig = useReportExportConfig({
    report,
    reportMode: data.reportMode,
    trialBalanceRows: data.trialBalance.data?.rows ?? [],
    incomeRows,
    expenseRows,
    balanceAssets: data.balanceSheet.data?.assets ?? [],
    balanceLiabilities: data.balanceSheet.data?.liabilities ?? [],
    balanceEquity: data.balanceSheet.data?.equity ?? [],
    cashFlow: data.cashFlow.data ?? null,
    monthlyBranches: data.monthlyBranchSummary.data?.branches ?? [],
    monthlyIncomeRows: data.monthlyBranchSummary.data?.incomeRows ?? [],
    monthlyExpenseRows: data.monthlyBranchSummary.data?.expenseRows ?? [],
    accountStatementRows: (data.accountStatement.data?.rows ?? []).map((row) => ({
      entryDate: row.entryDate,
      memo: row.memo ?? null,
      branchName: row.branchName ?? null,
      locationName: row.locationName ?? null,
      debitPsw: row.debitPsw,
      creditPsw: row.creditPsw,
      runningBalancePsw: row.runningBalancePsw,
    })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{REPORT_META[report].title}</h1>
        <p className="text-sm text-muted-foreground">
          These reports are generated from posted journal lines, so they stay aligned with confirmed
          accounting activity rather than raw operational entries.
        </p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                data.setAppliedFilters({
                  branchId: data.branchId,
                  locationId: data.locationId,
                  accountId: data.accountId,
                  dateFrom: data.dateFrom,
                  dateTo: data.dateTo,
                })
              }
              disabled={!data.hasPendingFilterChanges}
            >
              Load report
            </Button>
            <Button
              variant="outline"
              disabled={!data.appliedFilters}
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
              disabled={!data.appliedFilters}
              onClick={() => void printHtml(exportConfig.title, exportConfig.sections)}
            >
              Print Report
            </Button>
          </div>

          <ReportFiltersCard
            accountId={data.accountId}
            accounts={data.accounts}
            appliedFilters={data.appliedFilters}
            branchId={data.branchId}
            branchOptions={data.branchOptions}
            dateFrom={data.dateFrom}
            dateTo={data.dateTo}
            locationId={data.locationId}
            locationOptions={data.locationOptions}
            reportMode={data.reportMode}
            setAccountId={data.setAccountId}
            setBranchId={data.setBranchId}
            setDateFrom={data.setDateFrom}
            setDateTo={data.setDateTo}
            setLocationId={data.setLocationId}
          />

          <ReportResults data={data} report={report} />
        </div>
      </ScrollableWrapper>
    </div>
  );
}
