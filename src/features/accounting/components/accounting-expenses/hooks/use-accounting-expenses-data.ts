import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BranchType, ExpenseFundingSource, ExpenseRequestStatus } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { type AuthUser } from '@/stores/auth-store';
import {
  type ExpenseRequestRow,
  useApproveExpenseRequestMutation,
  useCreateExpenseRequestMutation,
  useListCompanyBankAccountsQuery,
  useListExpenseCategoriesQuery,
  useListExpenseRequestsQuery,
  usePayExpenseRequestMutation,
  usePostExpenseRequestMutation,
  useRejectExpenseRequestMutation,
  useSubmitExpenseRequestMutation,
} from '../../../api';
import type { ExpensesPageView } from '../types/accounting-expenses.types';

export function useAccountingExpensesData({
  user,
  view,
}: {
  user: AuthUser;
  view: ExpensesPageView;
}) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user.branch?.id ?? '';
  const defaultLocationId = user.location?.id ?? '';
  const isHeadOffice = user.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user.branch?.id ?? '';

  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [fundingSource, setFundingSource] = useState(String(ExpenseFundingSource.PETTY_CASH));
  const [amountCedis, setAmountCedis] = useState('');
  const [purpose, setPurpose] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [companyBankAccountId, setCompanyBankAccountId] = useState('');
  const [rejectingRow, setRejectingRow] = useState<ExpenseRequestRow | null>(null);

  const effectiveBranchId = isHeadOffice ? branchId : userBranchId;

  useEffect(() => {
    if (!isHeadOffice && userBranchId && branchId !== userBranchId) {
      setBranchId(userBranchId);
    }
  }, [branchId, isHeadOffice, userBranchId]);

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId || !isHeadOffice },
  );
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    companyId && effectiveBranchId ? { companyId, branchId: effectiveBranchId } : undefined,
    { skip: !companyId || !effectiveBranchId },
  );
  const { data: expenseCategories = [] } = useListExpenseCategoriesQuery(
    { companyId, active: true },
    { skip: !companyId },
  );
  const { data: bankAccounts = [] } = useListCompanyBankAccountsQuery(
    { companyId, active: true },
    { skip: !companyId },
  );
  const {
    data: expenseRequests = [],
    isFetching,
    refetch,
  } = useListExpenseRequestsQuery(
    { companyId, branchId: effectiveBranchId || undefined },
    { skip: !companyId },
  );

  const [createExpenseRequest, { isLoading: isCreating }] = useCreateExpenseRequestMutation();
  const [submitExpenseRequest, { isLoading: isSubmitting }] = useSubmitExpenseRequestMutation();
  const [approveExpenseRequest, { isLoading: isApproving }] = useApproveExpenseRequestMutation();
  const [rejectExpenseRequest, { isLoading: isRejecting }] = useRejectExpenseRequestMutation();
  const [payExpenseRequest, { isLoading: isPaying }] = usePayExpenseRequestMutation();
  const [postExpenseRequest, { isLoading: isPosting }] = usePostExpenseRequestMutation();

  const expenseCategoryNameById = useMemo(
    () => new Map(expenseCategories.map((category) => [category.id, category.name])),
    [expenseCategories],
  );
  const bankNameById = useMemo(
    () => new Map(bankAccounts.map((account) => [account.id, account.name])),
    [bankAccounts],
  );

  const isMutating =
    isCreating || isSubmitting || isApproving || isRejecting || isPaying || isPosting;

  async function handleCreate() {
    if (!companyId || !effectiveBranchId || !user.id) {
      toast.error('Authenticated user and branch are required');
      return;
    }

    const amount = Number(amountCedis);
    if (!expenseCategoryId || !Number.isFinite(amount) || amount <= 0 || !purpose.trim()) {
      toast.error('Select category and enter a valid amount and purpose');
      return;
    }

    try {
      await createExpenseRequest({
        companyId,
        branchId: effectiveBranchId,
        locationId: locationId || null,
        expenseCategoryId,
        amountCedis: amount,
        fundingSource: Number(fundingSource),
        purpose: purpose.trim(),
        referenceNo: referenceNo.trim() || null,
        requestedByUserId: user.id,
        recordedByUserId: user.id,
      }).unwrap();

      toast.success('Expense request recorded');
      setExpenseCategoryId('');
      setAmountCedis('');
      setPurpose('');
      setReferenceNo('');
      setCompanyBankAccountId('');
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create expense request');
    }
  }

  async function runExpenseAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) {
    try {
      await action();
      toast.success(successMessage);
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || failureMessage);
    }
  }

  const pendingCount = expenseRequests.filter(
    (row) =>
      row.status !== ExpenseRequestStatus.POSTED && row.status !== ExpenseRequestStatus.REJECTED,
  ).length;
  const totalRequestedPsw = expenseRequests.reduce((sum, row) => sum + row.amountPsw, 0);

  const tableRows =
    view === 'drafts'
      ? expenseRequests.filter((row) => row.status === ExpenseRequestStatus.RECORDED)
      : view === 'approvals'
        ? expenseRequests.filter((row) => row.status === ExpenseRequestStatus.SUBMITTED)
        : view === 'payments'
          ? expenseRequests.filter((row) => row.status === ExpenseRequestStatus.APPROVED)
          : view === 'posting'
            ? expenseRequests.filter((row) => row.status === ExpenseRequestStatus.PAID)
            : view === 'history'
              ? expenseRequests.filter(
                  (row) =>
                    row.status === ExpenseRequestStatus.POSTED ||
                    row.status === ExpenseRequestStatus.REJECTED,
                )
              : [];

  return {
    amountCedis,
    bankAccounts,
    bankNameById,
    branchId,
    branchOptions,
    companyBankAccountId,
    effectiveBranchId,
    expenseCategories,
    expenseCategoryId,
    expenseCategoryNameById,
    expenseRequests,
    fundingSource,
    isFetching,
    isHeadOffice,
    isMutating,
    isRejecting,
    locationId,
    locationOptions,
    pendingCount,
    purpose,
    referenceNo,
    rejectingRow,
    tableRows,
    totalRequestedPsw,
    user,
    runExpenseAction,
    handleCreate,
    setAmountCedis,
    setBranchId,
    setCompanyBankAccountId,
    setExpenseCategoryId,
    setFundingSource,
    setLocationId,
    setPurpose,
    setReferenceNo,
    setRejectingRow,
    submitExpenseRequest,
    approveExpenseRequest,
    rejectExpenseRequest,
    payExpenseRequest,
    postExpenseRequest,
  };
}
