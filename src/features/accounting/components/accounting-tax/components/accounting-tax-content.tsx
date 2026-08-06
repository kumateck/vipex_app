import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { type AuthUser } from '@/stores/auth-store';
import { ReasonDialog } from '../../accounting-shared';
import { useAccountingTaxData } from '../hooks/use-accounting-tax-data';
import { useTaxColumns } from '../hooks/use-tax-columns';
import { TaxFilingPeriodCard } from './tax-filing-period-card';
import { TaxFilingPeriodsTableCard } from './tax-filing-periods-table-card';
import { TaxJournalItemsCard } from './tax-journal-items-card';
import { TaxMainStats } from './tax-main-stats';

export function AccountingTaxContent({ user }: { user: AuthUser }) {
  const data = useAccountingTaxData({ user });
  const columns = useTaxColumns({
    branchNameById: data.branchNameById,
    closeTaxFilingPeriod: data.closeTaxFilingPeriod,
    isMutating: data.isMutating,
    markTaxFilingPeriodUnderReview: data.markTaxFilingPeriodUnderReview,
    markTaxItemFiled: data.markTaxItemFiled,
    markTaxItemReady: data.markTaxItemReady,
    periodNameById: data.periodNameById,
    selectedPeriodId: data.selectedPeriodId,
    setExcludingRow: data.setExcludingRow,
    submitTaxFilingPeriod: data.submitTaxFilingPeriod,
    runPeriodAction: data.runPeriodAction,
    runTaxAction: data.runTaxAction,
    userId: data.user.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tax Filing Review</h1>
        <p className="text-sm text-muted-foreground">
          Tax amounts stay recorded in the system, while filing remains a controlled review workflow
          with visible exclusions and filing status.
        </p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <TaxMainStats
            readyCount={data.readyCount}
            taxItems={data.taxItems}
            totalTaxPsw={data.totalTaxPsw}
          />

          <TaxFilingPeriodCard
            filingPeriods={data.filingPeriods}
            isMutating={data.isMutating}
            periodDateFrom={data.periodDateFrom}
            periodDateTo={data.periodDateTo}
            periodName={data.periodName}
            periodNotes={data.periodNotes}
            selectedPeriodId={data.selectedPeriodId}
            setPeriodDateFrom={data.setPeriodDateFrom}
            setPeriodDateTo={data.setPeriodDateTo}
            setPeriodName={data.setPeriodName}
            setPeriodNotes={data.setPeriodNotes}
            setSelectedPeriodId={data.setSelectedPeriodId}
            handleCreatePeriod={data.handleCreatePeriod}
          />

          <TaxFilingPeriodsTableCard
            columns={columns.periodColumns}
            isLoading={data.isLoadingPeriods}
            periods={data.filingPeriods}
          />

          <TaxJournalItemsCard
            branchId={data.branchId}
            branchOptions={data.branchOptions}
            filingPeriods={data.filingPeriods}
            filingStatus={data.filingStatus}
            isLoadingItems={data.isLoadingItems}
            itemColumns={columns.itemColumns}
            selectedPeriodId={data.selectedPeriodId}
            setBranchId={data.setBranchId}
            setFilingStatus={data.setFilingStatus}
            setSelectedPeriodId={data.setSelectedPeriodId}
            taxItems={data.taxItems}
          />
        </div>
      </ScrollableWrapper>

      <ReasonDialog
        open={Boolean(data.excludingRow)}
        title="Exclude Tax Item"
        label="Exclusion Reason"
        description="Excluded items remain visible for audit. Use a clear operational reason for the exclusion."
        confirmLabel="Exclude Item"
        loading={data.isExcluding}
        onClose={() => data.setExcludingRow(null)}
        onConfirm={async (reason) => {
          const excludingRow = data.excludingRow;
          const userId = data.user.id;
          if (!excludingRow || !userId) return;

          await data.runTaxAction(
            () =>
              data
                .excludeTaxItem({
                  id: excludingRow.id,
                  reason,
                  actedByUserId: userId,
                })
                .unwrap(),
            'Tax item excluded from filing set',
            'Failed to exclude tax item',
          );
          data.setExcludingRow(null);
        }}
      />
    </div>
  );
}
