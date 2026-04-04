import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { BranchType, CashConfirmationStatus, UserType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  type DailyCashConfirmationRow,
  useConfirmDailyCashConfirmationMutation,
  useCreateDailyCashConfirmationMutation,
  useGetDailyCashExpectedSummaryQuery,
  useListDailyCashConfirmationsQuery,
  usePostDailyCashConfirmationMutation,
} from '../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  cashConfirmationStatusLabel,
  formatDate,
  formatMoney,
  QuickAmountInput,
  StatusBadge,
  todayDateInputValue,
} from './accounting-shared';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function AccountingDailyCashPage() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canAccessDailyCash =
    permissions.has(PermissionKeys.CanCreateDailyCashConfirmation) ||
    permissions.has(PermissionKeys.CanConfirmDailyCashConfirmation) ||
    permissions.has(PermissionKeys.CanPostDailyCashConfirmation);
  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }
  if (!canAccessDailyCash) {
    return (
      <AccountingUnauthorizedState
        title="Daily Cash Restricted"
        description="Your role does not include permission to create, confirm, or post daily cash entries."
      />
    );
  }

  return <AccountingDailyCashPageContent user={user} />;
}

function AccountingDailyCashPageContent({ user }: { user: AuthUser }) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user?.branch?.id ?? '';

  const [branchId, setBranchId] = useState(defaultBranchId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [cashierUserId, setCashierUserId] = useState('');
  const [confirmationDate, setConfirmationDate] = useState(todayDateInputValue());
  const [expectedCashCedis, setExpectedCashCedis] = useState('');
  const [expectedCashOverrideScope, setExpectedCashOverrideScope] = useState<string | null>(null);
  const [countedCashCedis, setCountedCashCedis] = useState('');
  const [notes, setNotes] = useState('');
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
  const { data: cashierOptions = [] } = useListUserOptionsQuery(
    companyId && effectiveBranchId
      ? {
          companyId,
          branchId: effectiveBranchId,
          locationId: locationId || undefined,
          userType: UserType.CASHIER,
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
          ...(user?.branch?.id && user?.branch?.name ? [[user.branch.id, user.branch.name]] : []),
          ...branchOptions.map((branch) => [branch.id, branch.name]),
        ].map(([id, name]) => [id as string, name as string]),
      ),
    [branchOptions, user?.branch?.id, user?.branch?.name],
  );
  const locationNameById = useMemo(
    () => new Map(locationOptions.map((location) => [location.id, location.name])),
    [locationOptions],
  );
  const cashierNameById = useMemo(
    () => new Map(cashierOptions.map((cashier) => [cashier.id, cashier.fullname])),
    [cashierOptions],
  );

  const isMutating = isCreating || isConfirming || isPosting;
  const expectedScopeKey = `${effectiveBranchId}:${locationId}:${cashierUserId}:${confirmationDate}`;
  const suggestedExpectedCashCedis = useMemo(
    () => ((expectedSummary?.cashSalesPsw ?? 0) / 100).toFixed(2),
    [expectedSummary?.cashSalesPsw],
  );
  const expectedCashInputValue =
    expectedCashOverrideScope === expectedScopeKey ? expectedCashCedis : suggestedExpectedCashCedis;

  const confirmationDateValue = confirmationDate
    ? new Date(`${confirmationDate}T00:00:00`)
    : undefined;
  const isConfirmationDateValid = Boolean(
    confirmationDateValue && !Number.isNaN(confirmationDateValue.getTime()),
  );

  function toDateInputValue(date?: Date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function handleCreate() {
    if (!companyId || !effectiveBranchId || !user?.id) {
      toast.error('Authenticated company, branch and user are required');
      return;
    }

    const expected = Number(expectedCashInputValue);
    const counted = Number(countedCashCedis);
    if (!Number.isFinite(expected) || expected < 0 || !Number.isFinite(counted) || counted < 0) {
      toast.error('Enter valid expected and counted cash amounts');
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
        countedCashCedis: counted,
        notes: notes.trim() || null,
        createdBy: user.id,
      }).unwrap();
      toast.success('Daily cash confirmation recorded');
      setExpectedCashCedis('');
      setExpectedCashOverrideScope(null);
      setCountedCashCedis('');
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
    if (!user?.id) return;
    try {
      await confirmConfirmation({ id: row.id, accountantUserId: user.id }).unwrap();
      toast.success('Daily cash confirmation marked as confirmed');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm daily cash');
    }
  }

  async function handlePost(row: DailyCashConfirmationRow) {
    if (!user?.id) return;
    try {
      await postConfirmation({ id: row.id, postedBy: user.id }).unwrap();
      toast.success('Daily cash confirmation posted to ledger');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post daily cash');
    }
  }

  const columns = useMemo<ColumnDef<DailyCashConfirmationRow>[]>(
    () => [
      {
        accessorKey: 'confirmationDate',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.confirmationDate),
      },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) => branchNameById.get(row.branchId) ?? row.branchId,
      },
      {
        id: 'location',
        header: 'Location',
        accessorFn: (row) =>
          row.locationId ? (locationNameById.get(row.locationId) ?? row.locationId) : '-',
      },
      {
        id: 'cashier',
        header: 'Cashier',
        accessorFn: (row) =>
          row.cashierUserId ? (cashierNameById.get(row.cashierUserId) ?? row.cashierUserId) : '-',
      },
      {
        id: 'expected',
        header: 'Expected',
        accessorFn: (row) => formatMoney(row.expectedCashPsw),
      },
      {
        id: 'counted',
        header: 'Counted',
        accessorFn: (row) => formatMoney(row.countedCashPsw),
      },
      {
        id: 'variance',
        header: 'Variance',
        accessorFn: (row) =>
          row.shortagePsw > 0
            ? `Short ${formatMoney(row.shortagePsw)}`
            : row.overagePsw > 0
              ? `Over ${formatMoney(row.overagePsw)}`
              : 'Balanced',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.status === CashConfirmationStatus.POSTED
              ? 'default'
              : row.original.status === CashConfirmationStatus.CONFIRMED
                ? 'secondary'
                : 'outline';
          return (
            <StatusBadge label={cashConfirmationStatusLabel(row.original.status)} tone={tone} />
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canConfirm = row.original.status === CashConfirmationStatus.DRAFT;
          const canPost = row.original.status === CashConfirmationStatus.CONFIRMED;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canConfirm && !canPost}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canConfirm ? (
                  <DropdownMenuItem
                    disabled={isMutating}
                    onClick={() => {
                      void handleConfirm(row.original);
                    }}
                  >
                    Confirm
                  </DropdownMenuItem>
                ) : null}
                {canPost ? (
                  <DropdownMenuItem
                    disabled={isMutating}
                    onClick={() => {
                      void handlePost(row.original);
                    }}
                  >
                    Post
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [branchNameById, cashierNameById, isMutating, locationNameById],
  );

  const totalExpectedPsw = confirmations.reduce((sum, row) => sum + row.expectedCashPsw, 0);
  const totalCountedPsw = confirmations.reduce((sum, row) => sum + row.countedCashPsw, 0);

  function applyExpectedCashFromOperations() {
    setExpectedCashCedis('');
    setExpectedCashOverrideScope(null);
    toast.success('Expected cash pulled from recorded cash payments');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Cash Confirmation</h1>
        <p className="text-sm text-muted-foreground">
          Branch accountants can record counted cash, confirm it against expected sales, and post
          only the confirmed batch to the ledger.
        </p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Expected</CardDescription>
                <CardTitle>{formatMoney(totalExpectedPsw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Counted</CardDescription>
                <CardTitle>{formatMoney(totalCountedPsw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Open Confirmations</CardDescription>
                <CardTitle>
                  {
                    confirmations.filter((row) => row.status !== CashConfirmationStatus.POSTED)
                      .length
                  }
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Expected Physical Cash</CardDescription>
                <CardTitle>{formatMoney(expectedSummary?.cashSalesPsw ?? 0)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Cash-only collections from recorded payments for the selected day.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Non-Cash Collections</CardDescription>
                <CardTitle>{formatMoney(expectedSummary?.nonCashSalesPsw ?? 0)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Mobile money and other non-cash receipts are shown separately for review.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Sales In View</CardDescription>
                <CardTitle>{formatMoney(expectedSummary?.totalSalesPsw ?? 0)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Combined cash and non-cash receipts for the selected filters.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Payment Count</CardDescription>
                <CardTitle>{expectedSummary?.transactionCount ?? 0}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Sender, receiver, and delivery collections included in the day summary.
              </CardContent>
            </Card>
          </div>

          {expectedSummary?.session ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Session Status</CardDescription>
                  <CardTitle>{expectedSummary.session.status}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Started {formatDate(expectedSummary.session.scheduledStartTime)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Expected Closing Balance</CardDescription>
                  <CardTitle>
                    {formatMoney(expectedSummary.session.expectedClosingBalancePsw ?? 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Reported Closing Balance</CardDescription>
                  <CardTitle>
                    {formatMoney(expectedSummary.session.closingBalancePsw ?? 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Session Variance</CardDescription>
                  <CardTitle>{formatMoney(expectedSummary.session.variancePsw ?? 0)}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Record Daily Confirmation</CardTitle>
              <CardDescription>
                Use this when the branch accountant physically counts cash at a location or cashier
                point.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-cash-branch">Branch</Label>
                  {isHeadOffice ? (
                    <Select
                      value={branchId}
                      onValueChange={(value) => {
                        setBranchId(value);
                        setLocationId('');
                        setCashierUserId('');
                      }}
                    >
                      <SelectTrigger id="daily-cash-branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={user?.branch?.name ?? 'My branch'} disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-cash-location">Location</Label>
                  <Select
                    value={locationId || 'all'}
                    onValueChange={(value) => {
                      setLocationId(value === 'all' ? '' : value);
                      setCashierUserId('');
                    }}
                  >
                    <SelectTrigger id="daily-cash-location">
                      <SelectValue placeholder="All branch locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Branch Level</SelectItem>
                      {locationOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-cash-cashier">Cashier / Officer</Label>
                  <Select
                    value={cashierUserId || 'all'}
                    onValueChange={(value) => setCashierUserId(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger id="daily-cash-cashier">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Branch Rollup</SelectItem>
                      {cashierOptions.map((cashier) => (
                        <SelectItem key={cashier.id} value={cashier.id}>
                          {cashier.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-cash-date">Confirmation Date</Label>
                  <DatePicker
                    date={isConfirmationDateValid ? confirmationDateValue : undefined}
                    onDateChange={(value) => setConfirmationDate(toDateInputValue(value))}
                    placeholder="Select date"
                  />
                </div>
                <QuickAmountInput
                  id="daily-cash-expected"
                  label="Expected Cash (GHS)"
                  value={expectedCashInputValue}
                  onChange={(value) => {
                    setExpectedCashOverrideScope(expectedScopeKey);
                    setExpectedCashCedis(value);
                  }}
                />
                <QuickAmountInput
                  id="daily-cash-counted"
                  label="Counted Cash (GHS)"
                  value={countedCashCedis}
                  onChange={setCountedCashCedis}
                />
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="daily-cash-notes">Notes</Label>
                  <Input
                    id="daily-cash-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Optional notes about count, shortage, or overage"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
                <div className="flex-1 text-muted-foreground">
                  Use recorded cash collections for this branch, location, cashier, and date to
                  prefill the expected physical cash.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyExpectedCashFromOperations}
                  disabled={isFetchingExpected}
                >
                  Use Expected Cash
                </Button>
                {expectedSummary?.session?.closingBalancePsw != null ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setCountedCashCedis(
                        ((expectedSummary.session?.closingBalancePsw ?? 0) / 100).toFixed(2),
                      )
                    }
                  >
                    Use Session Closing
                  </Button>
                ) : null}
                {expectedSummary?.session?.expectedClosingBalancePsw != null ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setCountedCashCedis(
                        ((expectedSummary.session?.expectedClosingBalancePsw ?? 0) / 100).toFixed(
                          2,
                        ),
                      )
                    }
                  >
                    Use Expected Closing
                  </Button>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  Sender {formatMoney(expectedSummary?.senderSalesPsw ?? 0)} • Receiver{' '}
                  {formatMoney(expectedSummary?.receiverSalesPsw ?? 0)} • Delivery{' '}
                  {formatMoney(expectedSummary?.deliverySalesPsw ?? 0)}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => void handleCreate()}
                  disabled={isMutating || !effectiveBranchId}
                >
                  Record Confirmation
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recorded Confirmations</CardTitle>
              <CardDescription>
                Drafts can be confirmed, and confirmed rows can then be posted into the ledger.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={confirmations}
                columns={columns}
                loading={isFetching}
                searchPlaceholder="Search daily cash confirmations"
                showSearch
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
