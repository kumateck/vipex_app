import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { type AuthUser } from '@/stores/auth-store';
import { ReasonDialog } from '../../accounting-shared';
import { useAccountingExpensesData } from '../hooks/use-accounting-expenses-data';
import { useExpenseColumns } from '../hooks/use-expense-columns';
import type { ExpensesPageView } from '../types/accounting-expenses.types';
import { ExpenseRequestFormCard } from './expense-request-form-card';
import { ExpensesMainStats } from './expenses-main-stats';
import { ExpensesTableCard } from './expenses-table-card';

export function AccountingExpensesContent({
  user,
  view,
}: {
  user: AuthUser;
  view: ExpensesPageView;
}) {
  const data = useAccountingExpensesData({ user, view });
  const columns = useExpenseColumns({
    approveExpenseRequest: data.approveExpenseRequest,
    bankNameById: data.bankNameById,
    companyBankAccountId: data.companyBankAccountId,
    expenseCategoryNameById: data.expenseCategoryNameById,
    isMutating: data.isMutating,
    payExpenseRequest: data.payExpenseRequest,
    postExpenseRequest: data.postExpenseRequest,
    runExpenseAction: data.runExpenseAction,
    setRejectingRow: data.setRejectingRow,
    submitExpenseRequest: data.submitExpenseRequest,
    userId: data.user.id,
  });

  const pageTitle =
    view === 'drafts'
      ? 'Expense Drafts'
      : view === 'approvals'
        ? 'Expense Approvals'
        : view === 'payments'
          ? 'Expense Payments'
          : view === 'posting'
            ? 'Expense Posting'
            : view === 'history'
              ? 'Expense History'
              : 'Expense Requests';

  const pageDescription =
    view === 'drafts'
      ? 'Recorded expenses waiting to be submitted into the approval flow.'
      : view === 'approvals'
        ? 'Submitted requests waiting for approve or reject decisions.'
        : view === 'payments'
          ? 'Approved requests waiting to be marked as paid.'
          : view === 'posting'
            ? 'Paid requests waiting to be posted to the ledger.'
            : view === 'history'
              ? 'Posted and rejected expense requests kept for audit visibility.'
              : 'Record branch and location expenses, route them for approval, and post only approved and paid amounts into the ledger.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <ExpensesMainStats
            bankAccounts={data.bankAccounts}
            pendingCount={data.pendingCount}
            totalRequestedPsw={data.totalRequestedPsw}
          />

          {view === 'main' ? (
            <ExpenseRequestFormCard
              amountCedis={data.amountCedis}
              bankAccounts={data.bankAccounts}
              branchId={data.branchId}
              branchOptions={data.branchOptions}
              companyBankAccountId={data.companyBankAccountId}
              effectiveBranchId={data.effectiveBranchId}
              expenseCategories={data.expenseCategories}
              expenseCategoryId={data.expenseCategoryId}
              fundingSource={data.fundingSource}
              isHeadOffice={data.isHeadOffice}
              isMutating={data.isMutating}
              locationId={data.locationId}
              locationOptions={data.locationOptions}
              purpose={data.purpose}
              referenceNo={data.referenceNo}
              setAmountCedis={data.setAmountCedis}
              setBranchId={data.setBranchId}
              setCompanyBankAccountId={data.setCompanyBankAccountId}
              setExpenseCategoryId={data.setExpenseCategoryId}
              setFundingSource={data.setFundingSource}
              setLocationId={data.setLocationId}
              setPurpose={data.setPurpose}
              setReferenceNo={data.setReferenceNo}
              user={data.user}
              handleCreate={data.handleCreate}
            />
          ) : null}

          <ExpensesTableCard
            columns={columns}
            isFetching={data.isFetching}
            pageDescription={pageDescription}
            pageTitle={pageTitle}
            rows={data.tableRows}
            view={view}
          />
        </div>
      </ScrollableWrapper>

      <ReasonDialog
        open={Boolean(data.rejectingRow)}
        title="Reject Expense Request"
        label="Rejection Reason"
        description="Rejected requests remain visible in accounting, so add a clear reason for the audit trail."
        confirmLabel="Reject Request"
        loading={data.isRejecting}
        onClose={() => data.setRejectingRow(null)}
        onConfirm={async (reason) => {
          const rejectingRow = data.rejectingRow;
          const userId = data.user.id;
          if (!rejectingRow || !userId) return;

          await data.runExpenseAction(
            () =>
              data
                .rejectExpenseRequest({
                  id: rejectingRow.id,
                  approvedByUserId: userId,
                  rejectionReason: reason,
                })
                .unwrap(),
            'Expense request rejected',
            'Failed to reject expense request',
          );
          data.setRejectingRow(null);
        }}
      />
    </div>
  );
}
