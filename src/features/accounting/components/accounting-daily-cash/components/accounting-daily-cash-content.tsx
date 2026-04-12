import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { type AuthUser } from '@/stores/auth-store';
import { useAccountingDailyCashData } from '../hooks/use-accounting-daily-cash-data';
import { useDailyCashColumns } from '../hooks/use-daily-cash-columns';
import type { DailyCashPageView } from '../types/accounting-daily-cash.types';
import { DailyCashMainFooterCard } from './daily-cash-main-footer-card';
import { DailyCashMainStats } from './daily-cash-main-stats';
import { DailyCashRecordFormCard } from './daily-cash-record-form-card';
import { DailyCashTableCard } from './daily-cash-table-card';

export function AccountingDailyCashContent({
  user,
  view,
}: {
  user: AuthUser;
  view: DailyCashPageView;
}) {
  const data = useAccountingDailyCashData({ user, view });
  const columns = useDailyCashColumns({
    branchNameById: data.branchNameById,
    cashierNameById: data.cashierNameById,
    isMutating: data.isMutating,
    locationNameById: data.locationNameById,
    onConfirm: data.handleConfirm,
    onPost: data.handlePost,
    view,
  });

  const pageTitle =
    view === 'drafts'
      ? 'Daily Cash Drafts'
      : view === 'recorded'
        ? 'Recorded Confirmations'
        : view === 'approvals'
          ? 'Daily Cash Approvals'
          : 'Daily Cash Confirmation';

  const pageDescription =
    view === 'drafts'
      ? 'Draft confirmations awaiting accountant confirmation.'
      : view === 'recorded'
        ? 'Confirmed and posted confirmations. Confirmed rows can be posted into the ledger.'
        : view === 'approvals'
          ? 'Approve draft confirmations, then route confirmed entries for ledger posting.'
          : 'Branch accountants can record counted cash before confirmation and posting.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          {view === 'main' ? (
            <>
              <DailyCashMainStats
                confirmations={data.confirmations}
                expectedSummary={data.expectedSummary}
                totalCountedPsw={data.totalCountedPsw}
                totalExpectedPsw={data.totalExpectedPsw}
              />
              <DailyCashRecordFormCard
                branchId={data.branchId}
                branchOptions={data.branchOptions}
                canRecordConfirmation={data.canRecordConfirmation}
                cashierOptions={data.cashierOptions}
                cashierUserId={data.cashierUserId}
                confirmationDate={data.confirmationDate}
                countedAirtelCedis={data.countedAirtelCedis}
                countedCashCedis={data.countedCashCedis}
                countedMtnCedis={data.countedMtnCedis}
                countedTelecelCedis={data.countedTelecelCedis}
                expectedAirtelCedis={data.expectedAirtelCedis}
                expectedCashInputValue={data.expectedCashInputValue}
                expectedMtnCedis={data.expectedMtnCedis}
                expectedScopeKey={data.expectedScopeKey}
                expectedSummary={data.expectedSummary}
                expectedTelecelCedis={data.expectedTelecelCedis}
                isFetchingExpected={data.isFetchingExpected}
                isHeadOffice={data.isHeadOffice}
                locationId={data.locationId}
                locationOptionsWithFallback={data.locationOptionsWithFallback}
                notes={data.notes}
                setBranchId={data.setBranchId}
                setCashierUserId={data.setCashierUserId}
                setConfirmationDate={data.setConfirmationDate}
                setCountedAirtelCedis={data.setCountedAirtelCedis}
                setCountedCashCedis={data.setCountedCashCedis}
                setCountedMtnCedis={data.setCountedMtnCedis}
                setCountedTelecelCedis={data.setCountedTelecelCedis}
                setExpectedCashCedis={data.setExpectedCashCedis}
                setExpectedCashOverrideScope={data.setExpectedCashOverrideScope}
                setLocationId={data.setLocationId}
                setNotes={data.setNotes}
                user={data.user}
                handleCreate={data.handleCreate}
                applyExpectedCashFromOperations={data.applyExpectedCashFromOperations}
              />
              <DailyCashMainFooterCard />
            </>
          ) : (
            <DailyCashTableCard
              columns={columns}
              isFetching={data.isFetching}
              rows={data.tableRows}
              view={view}
            />
          )}
        </div>
      </ScrollableWrapper>
    </div>
  );
}
