import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { type AuthUser } from '@/stores/auth-store';
import {
  useGetManualJournalApprovalPolicyQuery,
  useListAccountsQuery,
  usePostManualJournalEntryMutation,
} from '../../../api';
import {
  createEmptyManualLine,
  type ManualLineForm,
  parseCedisToPesewas,
} from '../types/manual-journal-entry.types';

export function useManualJournalEntryForm({
  user,
  canCreate,
  canApprove,
}: {
  user: AuthUser;
  canCreate: boolean;
  canApprove: boolean;
}) {
  const companyId = user.company?.id ?? '';
  const [branchId, setBranchId] = useState(user.branch?.id ?? '');
  const [locationId, setLocationId] = useState(user.location?.id ?? '');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<ManualLineForm[]>([
    createEmptyManualLine(),
    createEmptyManualLine(),
  ]);

  const { data: branches = [] } = useListBranchOptionsQuery(companyId ? { companyId } : undefined, {
    skip: !companyId,
  });
  const { data: locations = [] } = useListLocationOptionsQuery(
    companyId && branchId ? { companyId, branchId } : undefined,
    { skip: !companyId || !branchId },
  );
  const { data: accounts = [] } = useListAccountsQuery(
    { companyId, active: true },
    { skip: !companyId },
  );
  const { data: policy } = useGetManualJournalApprovalPolicyQuery(
    { companyId },
    { skip: !companyId },
  );
  const [postManualJournalEntry, { isLoading }] = usePostManualJournalEntryMutation();

  const postableAccounts = useMemo(
    () => accounts.filter((account) => account.isPostable),
    [accounts],
  );

  const totals = useMemo(() => {
    const debitPsw = lines.reduce((sum, line) => {
      if (line.entryType !== 'debit') return sum;
      return sum + Number(parseCedisToPesewas(line.amountCedis) ?? 0);
    }, 0);
    const creditPsw = lines.reduce((sum, line) => {
      if (line.entryType !== 'credit') return sum;
      return sum + Number(parseCedisToPesewas(line.amountCedis) ?? 0);
    }, 0);

    return {
      debitPsw,
      creditPsw,
      balanced: debitPsw === creditPsw && debitPsw > 0,
    };
  }, [lines]);

  const canSubmit = canCreate || canApprove;

  function updateLine(index: number, patch: Partial<ManualLineForm>) {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  function addLine() {
    setLines((current) => [...current, createEmptyManualLine()]);
  }

  function resetForm() {
    setMemo('');
    setLines([createEmptyManualLine(), createEmptyManualLine()]);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      toast.error('You do not have permission to submit manual journal entries');
      return;
    }

    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const normalizedLines = lines
      .map((line) => {
        const amountPsw = parseCedisToPesewas(line.amountCedis) ?? 0;

        return {
          accountId: line.accountId,
          debitPsw: line.entryType === 'debit' ? amountPsw : 0,
          creditPsw: line.entryType === 'credit' ? amountPsw : 0,
          description: line.description.trim() || null,
        };
      })
      .filter((line) => line.accountId && (line.debitPsw > 0 || line.creditPsw > 0));

    if (normalizedLines.length < 2) {
      toast.error('Add at least two valid journal lines');
      return;
    }

    if (!totals.balanced) {
      toast.error('Entry is not balanced');
      return;
    }

    try {
      const result = await postManualJournalEntry({
        companyId,
        branchId: branchId || null,
        locationId: locationId || null,
        memo: memo.trim() || null,
        entryDate,
        lines: normalizedLines,
      }).unwrap();

      toast.success(
        result.approvalMode === 'pending_approval'
          ? `Entry queued for approval (${result.manualEntryId})`
          : `Entry auto-authorized and posted (${result.entryId}). View in Reports > Journal Listing.`,
      );
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post manual journal entry');
    }
  }

  return {
    branchId,
    branches,
    canSubmit,
    entryDate,
    handleSubmit,
    isLoading,
    lines,
    locationId,
    locations,
    memo,
    policy,
    postableAccounts,
    totals,
    addLine,
    removeLine,
    resetForm,
    setBranchId,
    setEntryDate,
    setLocationId,
    setMemo,
    updateLine,
  };
}
