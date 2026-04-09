import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BranchType, CashConfirmationStatus, UserStatus, UserType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { type AuthUser } from '@/stores/auth-store';
import {
  type DailyCashConfirmationRow,
  useConfirmDailyCashConfirmationMutation,
  useCreateDailyCashConfirmationMutation,
  useGetDailyCashExpectedSummaryQuery,
  useListDailyCashConfirmationsQuery,
  usePostDailyCashConfirmationMutation,
} from '../../../api';
import { todayDateInputValue } from '../../accounting-shared';
import type { DailyCashPageView } from '../types/accounting-daily-cash.types';
export function useAccountingDailyCashData({
  user,
  view,
}: {
  user: AuthUser;
  view: DailyCashPageView;
}) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user.branch?.id ?? '';
  const defaultLocationId = user.location?.id ?? '';
  const isHeadOffice = user.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user.branch?.id ?? '';
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [cashierUserId, setCashierUserId] = useState('');
  const [confirmationDate, setConfirmationDate] = useState(todayDateInputValue());
  const [expectedCashCedis, setExpectedCashCedis] = useState('');
  const [expectedCashOverrideScope, setExpectedCashOverrideScope] = useState<string | null>(null);
  const [countedCashCedis, setCountedCashCedis] = useState('');
  const [countedMtnCedis, setCountedMtnCedis] = useState('0.00');
  const [countedTelecelCedis, setCountedTelecelCedis] = useState('0.00');
  const [countedAirtelCedis, setCountedAirtelCedis] = useState('0.00');
  const [notes, setNotes] = useState('');
  const effectiveBranchId = isHeadOffice ? branchId : userBranchId || branchId;
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
  const locationOptionsWithFallback = useMemo(() => {
    const options = [...locationOptions];
    const userLocationId = user.location?.id ?? null;
    const userLocationName = user.location?.name ?? null;
    if (!userLocationId || !userLocationName || !effectiveBranchId) return options;
    if (options.some((location) => location.id === userLocationId)) return options;
    return [
      ...options,
      { id: userLocationId, name: userLocationName, branchId: effectiveBranchId },
    ];
  }, [effectiveBranchId, locationOptions, user.location?.id, user.location?.name]);
  const { data: cashierOptions = [] } = useListUserOptionsQuery(
    companyId && effectiveBranchId
      ? {
          companyId,
          branchId: effectiveBranchId,
          locationId: locationId || undefined,
          userType: UserType.CASHIER,
          status: UserStatus.ACTIVE,
        }
      : undefined,
    { skip: !companyId || !effectiveBranchId },
  );
  const { data: expectedSummary, isFetching: isFetchingExpected } =
    useGetDailyCashExpectedSummaryQuery(
      {
        companyId,
        branchId: effectiveBranchId,
        confirmationDate,
        locationId: locationId || undefined,
        cashierUserId: cashierUserId || undefined,
      },
      { skip: !companyId || !effectiveBranchId || !confirmationDate },
    );
  const {
    data: confirmations = [],
    isFetching,
    refetch,
  } = useListDailyCashConfirmationsQuery(
    { companyId, branchId: effectiveBranchId || undefined },
    { skip: !companyId },
  );
  const [createConfirmation, { isLoading: isCreating }] = useCreateDailyCashConfirmationMutation();
  const [confirmConfirmation, { isLoading: isConfirming }] =
    useConfirmDailyCashConfirmationMutation();
  const [postConfirmation, { isLoading: isPosting }] = usePostDailyCashConfirmationMutation();
  const branchNameById = useMemo(
    () =>
      new Map(
        [
          ...(user.branch?.id && user.branch?.name ? [[user.branch.id, user.branch.name]] : []),
          ...branchOptions.map((branch) => [branch.id, branch.name]),
        ].map(([id, name]) => [id as string, name as string]),
      ),
    [branchOptions, user.branch?.id, user.branch?.name],
  );
  const locationNameById = useMemo(
    () => new Map(locationOptionsWithFallback.map((location) => [location.id, location.name])),
    [locationOptionsWithFallback],
  );
  const cashierNameById = useMemo(
    () => new Map(cashierOptions.map((cashier) => [cashier.id, cashier.fullname])),
    [cashierOptions],
  );
  const isMutating = isCreating || isConfirming || isPosting;
  const expectedScopeKey = `${effectiveBranchId}:${locationId}:${cashierUserId}:${confirmationDate}`;
  const suggestedExpectedCashCedis = ((expectedSummary?.cashSalesPsw ?? 0) / 100).toFixed(2);
  const expectedCashInputValue =
    expectedCashOverrideScope === expectedScopeKey ? expectedCashCedis : suggestedExpectedCashCedis;
  const expectedMtnCedis = ((expectedSummary?.mtnSalesPsw ?? 0) / 100).toFixed(2);
  const expectedTelecelCedis = ((expectedSummary?.telecelSalesPsw ?? 0) / 100).toFixed(2);
  const expectedAirtelCedis = ((expectedSummary?.airtelSalesPsw ?? 0) / 100).toFixed(2);
  const isCompletedSession = expectedSummary?.session?.status === 'COMPLETED';
  const canRecordConfirmation =
    !!effectiveBranchId && !!cashierUserId && isCompletedSession && !isMutating;
  async function handleCreate() {
    if (!companyId || !effectiveBranchId || !user.id) {
      toast.error('Authenticated company, branch and user are required');
      return;
    }
    if (countedCashCedis.trim() === '') {
      toast.error('Enter counted cash amount');
      return;
    }
    const expected = Number(expectedCashInputValue);
    const counted = Number(countedCashCedis);
    const countedMtn = Number(countedMtnCedis || '0');
    const countedTelecel = Number(countedTelecelCedis || '0');
    const countedAirtel = Number(countedAirtelCedis || '0');
    if (
      !Number.isFinite(expected) ||
      expected < 0 ||
      !Number.isFinite(counted) ||
      counted < 0 ||
      !Number.isFinite(countedMtn) ||
      countedMtn < 0 ||
      !Number.isFinite(countedTelecel) ||
      countedTelecel < 0 ||
      !Number.isFinite(countedAirtel) ||
      countedAirtel < 0
    ) {
      toast.error('Enter valid counted amounts for Cash, MTN, Telecel, and Airtel');
      return;
    }
    try {
      await createConfirmation({
        companyId,
        branchId: effectiveBranchId,
        locationId: locationId || null,
        cashierUserId: cashierUserId || null,
        confirmationDate: `${confirmationDate}T00:00:00.000Z`,
        expectedCashCedis: expected,
        expectedMtnCedis,
        expectedTelecelCedis,
        expectedAirtelCedis,
        countedCashCedis: counted,
        countedMtnCedis: countedMtn,
        countedTelecelCedis: countedTelecel,
        countedAirtelCedis: countedAirtel,
        notes: notes.trim() || null,
        createdBy: user.id,
      }).unwrap();
      toast.success('Daily cash confirmation recorded');
      setExpectedCashCedis('');
      setExpectedCashOverrideScope(null);
      setCountedCashCedis('');
      setCountedMtnCedis('0.00');
      setCountedTelecelCedis('0.00');
      setCountedAirtelCedis('0.00');
      setNotes('');
      setCashierUserId('');
      await refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create daily cash confirmation',
      );
    }
  }
  async function handleConfirm(row: DailyCashConfirmationRow) {
    if (!user.id) return;
    try {
      await confirmConfirmation({ id: row.id, accountantUserId: user.id }).unwrap();
      toast.success('Daily cash confirmation marked as confirmed');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm daily cash');
    }
  }
  async function handlePost(row: DailyCashConfirmationRow) {
    if (!user.id) return;
    try {
      await postConfirmation({ id: row.id, postedBy: user.id }).unwrap();
      toast.success('Daily cash confirmation posted to ledger');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post daily cash');
    }
  }
  function applyExpectedCashFromOperations() {
    setExpectedCashCedis('');
    setExpectedCashOverrideScope(null);
    setCountedCashCedis(((expectedSummary?.cashSalesPsw ?? 0) / 100).toFixed(2));
    setCountedMtnCedis(((expectedSummary?.mtnSalesPsw ?? 0) / 100).toFixed(2));
    setCountedTelecelCedis(((expectedSummary?.telecelSalesPsw ?? 0) / 100).toFixed(2));
    setCountedAirtelCedis(((expectedSummary?.airtelSalesPsw ?? 0) / 100).toFixed(2));
    toast.success('Expected payment-mode amounts applied (Cash, MTN, Telecel, Airtel)');
  }
  const totalExpectedPsw = confirmations.reduce((sum, row) => sum + row.expectedCashPsw, 0);
  const totalCountedPsw = confirmations.reduce((sum, row) => sum + row.countedCashPsw, 0);
  const tableRows =
    view === 'drafts' || view === 'approvals'
      ? confirmations.filter((row) => row.status === CashConfirmationStatus.DRAFT)
      : view === 'recorded'
        ? confirmations.filter((row) => row.status !== CashConfirmationStatus.DRAFT)
        : [];
  return {
    branchId,
    branchNameById,
    branchOptions,
    canRecordConfirmation,
    cashierNameById,
    cashierOptions,
    cashierUserId,
    confirmations,
    confirmationDate,
    countedAirtelCedis,
    countedCashCedis,
    countedMtnCedis,
    countedTelecelCedis,
    effectiveBranchId,
    expectedAirtelCedis,
    expectedCashInputValue,
    expectedMtnCedis,
    expectedScopeKey,
    expectedSummary,
    expectedTelecelCedis,
    isFetching,
    isFetchingExpected,
    isHeadOffice,
    isMutating,
    locationId,
    locationNameById,
    locationOptionsWithFallback,
    notes,
    tableRows,
    totalCountedPsw,
    totalExpectedPsw,
    user,
    view,
    applyExpectedCashFromOperations,
    handleConfirm,
    handleCreate,
    handlePost,
    setBranchId,
    setCashierUserId,
    setConfirmationDate,
    setCountedAirtelCedis,
    setCountedCashCedis,
    setCountedMtnCedis,
    setCountedTelecelCedis,
    setExpectedCashCedis,
    setExpectedCashOverrideScope,
    setLocationId,
    setNotes,
  };
}
