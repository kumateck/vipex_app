import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TaxFilingStatus } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { type AuthUser } from '@/stores/auth-store';
import {
  type TaxJournalItemRow,
  useCloseTaxFilingPeriodMutation,
  useCreateTaxFilingPeriodMutation,
  useExcludeTaxItemMutation,
  useListTaxFilingPeriodsQuery,
  useListTaxJournalItemsQuery,
  useMarkTaxFilingPeriodUnderReviewMutation,
  useMarkTaxItemFiledMutation,
  useMarkTaxItemReadyMutation,
  useSubmitTaxFilingPeriodMutation,
} from '../../../api';
import { todayDateInputValue } from '../../accounting-shared';

export function useAccountingTaxData({ user }: { user: AuthUser }) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user.branch?.id ?? '';

  const [branchId, setBranchId] = useState(defaultBranchId);
  const [filingStatus, setFilingStatus] = useState('all');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [periodName, setPeriodName] = useState('');
  const [periodDateFrom, setPeriodDateFrom] = useState(todayDateInputValue());
  const [periodDateTo, setPeriodDateTo] = useState(todayDateInputValue());
  const [periodNotes, setPeriodNotes] = useState('');
  const [excludingRow, setExcludingRow] = useState<TaxJournalItemRow | null>(null);

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId },
  );

  const {
    data: filingPeriods = [],
    isFetching: isLoadingPeriods,
    refetch: refetchPeriods,
  } = useListTaxFilingPeriodsQuery({ companyId }, { skip: !companyId });

  const {
    data: taxItems = [],
    isFetching: isLoadingItems,
    refetch: refetchTaxItems,
  } = useListTaxJournalItemsQuery(
    {
      companyId,
      branchId: branchId || undefined,
      filingStatus: filingStatus === 'all' ? undefined : Number(filingStatus),
      filingPeriodId: selectedPeriodId || undefined,
    },
    { skip: !companyId },
  );

  const [createTaxFilingPeriod, { isLoading: isCreatingPeriod }] =
    useCreateTaxFilingPeriodMutation();
  const [markTaxFilingPeriodUnderReview, { isLoading: isMarkingPeriodUnderReview }] =
    useMarkTaxFilingPeriodUnderReviewMutation();
  const [submitTaxFilingPeriod, { isLoading: isSubmittingPeriod }] =
    useSubmitTaxFilingPeriodMutation();
  const [closeTaxFilingPeriod, { isLoading: isClosingPeriod }] = useCloseTaxFilingPeriodMutation();
  const [markTaxItemReady, { isLoading: isMarkingReady }] = useMarkTaxItemReadyMutation();
  const [markTaxItemFiled, { isLoading: isMarkingFiled }] = useMarkTaxItemFiledMutation();
  const [excludeTaxItem, { isLoading: isExcluding }] = useExcludeTaxItemMutation();

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  const periodNameById = useMemo(
    () => new Map(filingPeriods.map((period) => [period.id, period.name])),
    [filingPeriods],
  );

  const isMutating =
    isCreatingPeriod ||
    isMarkingPeriodUnderReview ||
    isSubmittingPeriod ||
    isClosingPeriod ||
    isMarkingReady ||
    isMarkingFiled ||
    isExcluding;

  async function reloadAll() {
    await Promise.all([refetchPeriods(), refetchTaxItems()]);
  }

  async function handleCreatePeriod() {
    if (!companyId || !user.id || !periodName.trim()) {
      toast.error('Company, user, and filing period name are required');
      return;
    }

    try {
      const result = await createTaxFilingPeriod({
        companyId,
        name: periodName.trim(),
        dateFrom: periodDateFrom,
        dateTo: periodDateTo,
        notes: periodNotes.trim() || null,
        createdByUserId: user.id,
      }).unwrap();

      toast.success('Tax filing period created');
      setSelectedPeriodId(result.id);
      setPeriodName('');
      setPeriodNotes('');
      await reloadAll();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create tax filing period');
    }
  }

  async function runTaxAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) {
    try {
      await action();
      toast.success(successMessage);
      await refetchTaxItems();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || failureMessage);
    }
  }

  async function runPeriodAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) {
    try {
      await action();
      toast.success(successMessage);
      await reloadAll();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || failureMessage);
    }
  }

  const totalTaxPsw = taxItems.reduce((sum, row) => sum + row.taxTotalPsw, 0);
  const readyCount = taxItems.filter(
    (row) => row.filingStatus === TaxFilingStatus.READY_FOR_FILING,
  ).length;

  return {
    branchId,
    branchNameById,
    branchOptions,
    companyId,
    excludingRow,
    filingPeriods,
    filingStatus,
    isExcluding,
    isLoadingItems,
    isLoadingPeriods,
    isMutating,
    periodDateFrom,
    periodDateTo,
    periodName,
    periodNameById,
    periodNotes,
    readyCount,
    selectedPeriodId,
    taxItems,
    totalTaxPsw,
    user,
    runPeriodAction,
    runTaxAction,
    handleCreatePeriod,
    setBranchId,
    setExcludingRow,
    setFilingStatus,
    setPeriodDateFrom,
    setPeriodDateTo,
    setPeriodName,
    setPeriodNotes,
    setSelectedPeriodId,
    closeTaxFilingPeriod,
    excludeTaxItem,
    markTaxFilingPeriodUnderReview,
    markTaxItemFiled,
    markTaxItemReady,
    submitTaxFilingPeriod,
  };
}
