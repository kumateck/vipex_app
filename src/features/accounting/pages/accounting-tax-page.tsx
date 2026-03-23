import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaxFilingPeriodStatus, TaxFilingStatus } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  type TaxFilingPeriodRow,
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
} from '../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  filingPeriodStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  ReasonDialog,
  StatusBadge,
  taxFilingStatusLabel,
  todayDateInputValue,
} from './accounting-shared';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

export function AccountingTaxPage() {
  const user = useAuthStore((state) => state.user);
  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }
  if (!user.permissions?.includes(PermissionKeys.CanManageTaxFiling)) {
    return (
      <AccountingUnauthorizedState
        title="Tax Filing Restricted"
        description="Your role does not include permission to manage tax filing periods and tax filing actions."
      />
    );
  }

  return <AccountingTaxPageContent user={user} />;
}

function AccountingTaxPageContent({ user }: { user: AuthUser }) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user?.branch?.id ?? '';
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
    if (!companyId || !user?.id || !periodName.trim()) {
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
      toast.error(error instanceof Error ? error.message : 'Failed to create tax filing period');
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
      toast.error(error instanceof Error ? error.message : failureMessage);
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
      toast.error(error instanceof Error ? error.message : failureMessage);
    }
  }

  const periodColumns = useMemo<ColumnDef<TaxFilingPeriodRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Period',
      },
      {
        id: 'range',
        header: 'Date Range',
        accessorFn: (row) => `${formatDate(row.dateFrom)} to ${formatDate(row.dateTo)}`,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={filingPeriodStatusLabel(row.original.status)} tone="secondary" />
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => row.original.notes || '-',
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status === TaxFilingPeriodStatus.OPEN ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void runPeriodAction(
                    () => markTaxFilingPeriodUnderReview({ id: row.original.id }).unwrap(),
                    'Tax filing period moved to under review',
                    'Failed to move tax filing period to under review',
                  )
                }
                disabled={isMutating}
              >
                Review
              </Button>
            ) : null}
            {row.original.status === TaxFilingPeriodStatus.UNDER_REVIEW ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void runPeriodAction(
                    () => submitTaxFilingPeriod({ id: row.original.id }).unwrap(),
                    'Tax filing period submitted',
                    'Failed to submit tax filing period',
                  )
                }
                disabled={isMutating}
              >
                Submit
              </Button>
            ) : null}
            {row.original.status === TaxFilingPeriodStatus.SUBMITTED ? (
              <Button
                size="sm"
                onClick={() =>
                  void runPeriodAction(
                    () => closeTaxFilingPeriod({ id: row.original.id }).unwrap(),
                    'Tax filing period closed',
                    'Failed to close tax filing period',
                  )
                }
                disabled={isMutating}
              >
                Close
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [closeTaxFilingPeriod, isMutating, markTaxFilingPeriodUnderReview, submitTaxFilingPeriod],
  );

  const itemColumns = useMemo<ColumnDef<TaxJournalItemRow>[]>(
    () => [
      {
        id: 'postingDate',
        header: 'Posting Date',
        accessorFn: (row) => formatDate(row.postingDate),
      },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) => branchNameById.get(row.branchId) ?? row.branchId,
      },
      {
        id: 'sourceId',
        header: 'Source',
        accessorFn: (row) => row.sourceId ?? '-',
      },
      {
        id: 'base',
        header: 'Tax Base',
        accessorFn: (row) => formatMoney(row.taxBasePsw),
      },
      {
        id: 'taxTotal',
        header: 'Tax Total',
        accessorFn: (row) => formatMoney(row.taxTotalPsw),
      },
      {
        id: 'components',
        header: 'Components',
        accessorFn: (row) =>
          `VAT ${formatMoney(row.vatPsw)} • GETFund ${formatMoney(row.getfundPsw)} • NHIL ${formatMoney(row.nhilPsw)} • COVID ${formatMoney(row.covidPsw)}`,
      },
      {
        id: 'filingPeriod',
        header: 'Filing Period',
        accessorFn: (row) =>
          row.filingPeriodId ? (periodNameById.get(row.filingPeriodId) ?? row.filingPeriodId) : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.filingStatus === TaxFilingStatus.FILED
              ? 'default'
              : row.original.filingStatus === TaxFilingStatus.READY_FOR_FILING
                ? 'secondary'
                : 'outline';
          return (
            <StatusBadge label={taxFilingStatusLabel(row.original.filingStatus)} tone={tone} />
          );
        },
      },
      {
        id: 'reviewedAt',
        header: 'Reviewed',
        accessorFn: (row) => formatDateTime(row.reviewedAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.filingStatus === TaxFilingStatus.UNFILED ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void runTaxAction(
                    () =>
                      markTaxItemReady({
                        id: row.original.id,
                        filingPeriodId: selectedPeriodId,
                        actedByUserId: user?.id ?? '',
                      }).unwrap(),
                    'Tax item marked ready for filing',
                    'Failed to mark tax item ready',
                  )
                }
                disabled={isMutating || !selectedPeriodId || !user?.id}
              >
                Ready
              </Button>
            ) : null}
            {row.original.filingStatus === TaxFilingStatus.READY_FOR_FILING ? (
              <Button
                size="sm"
                onClick={() =>
                  void runTaxAction(
                    () =>
                      markTaxItemFiled({
                        id: row.original.id,
                        filingPeriodId: row.original.filingPeriodId ?? selectedPeriodId ?? null,
                        actedByUserId: user?.id ?? '',
                      }).unwrap(),
                    'Tax item marked as filed',
                    'Failed to mark tax item as filed',
                  )
                }
                disabled={isMutating || !user?.id}
              >
                Filed
              </Button>
            ) : null}
            {row.original.filingStatus !== TaxFilingStatus.FILED ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExcludingRow(row.original)}
                disabled={isMutating}
              >
                Exclude
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [
      branchNameById,
      isMutating,
      markTaxItemFiled,
      markTaxItemReady,
      periodNameById,
      selectedPeriodId,
      user?.id,
    ],
  );

  const totalTaxPsw = taxItems.reduce((sum, row) => sum + row.taxTotalPsw, 0);
  const readyCount = taxItems.filter(
    (row) => row.filingStatus === TaxFilingStatus.READY_FOR_FILING,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tax Filing Review</h1>
        <p className="text-sm text-muted-foreground">
          Tax amounts stay recorded in the system, while filing remains a controlled review workflow
          with visible exclusions and filing status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tax Items in View</CardDescription>
            <CardTitle>{taxItems.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tax</CardDescription>
            <CardTitle>{formatMoney(totalTaxPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ready for Filing</CardDescription>
            <CardTitle>{readyCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Filing Period</CardTitle>
          <CardDescription>
            Filing periods help you review and group tax items before they are marked as filed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tax-period-name">Period Name</Label>
              <Input
                id="tax-period-name"
                value={periodName}
                onChange={(event) => setPeriodName(event.target.value)}
                placeholder="March 2026 VAT Filing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-period-date-from">Date From</Label>
              <Input
                id="tax-period-date-from"
                type="date"
                value={periodDateFrom}
                onChange={(event) => setPeriodDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-period-date-to">Date To</Label>
              <Input
                id="tax-period-date-to"
                type="date"
                value={periodDateTo}
                onChange={(event) => setPeriodDateTo(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-period-filter">Current Filing Period</Label>
              <Select
                value={selectedPeriodId || 'all'}
                onValueChange={(value) => setSelectedPeriodId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="tax-period-filter">
                  <SelectValue placeholder="All periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All periods</SelectItem>
                  {filingPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-4">
              <Label htmlFor="tax-period-notes">Notes</Label>
              <Input
                id="tax-period-notes"
                value={periodNotes}
                onChange={(event) => setPeriodNotes(event.target.value)}
                placeholder="Optional notes for the filing review pack"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void handleCreatePeriod()} disabled={isMutating}>
              Create Filing Period
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filing Periods</CardTitle>
          <CardDescription>
            Keep filing periods visible so accounting and audit users can reconcile what was
            reviewed and filed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="client"
            data={filingPeriods}
            columns={periodColumns}
            loading={isLoadingPeriods}
            showSearch
            searchPlaceholder="Search filing periods"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Journal Items</CardTitle>
          <CardDescription>
            These items come from recorded taxable operations. Filing only changes review status and
            does not alter the underlying tax calculation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tax-branch-filter">Branch</Label>
              <Select
                value={branchId || 'all'}
                onValueChange={(value) => setBranchId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="tax-branch-filter">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-status-filter">Filing Status</Label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger id="tax-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value={String(TaxFilingStatus.UNFILED)}>Unfiled</SelectItem>
                  <SelectItem value={String(TaxFilingStatus.READY_FOR_FILING)}>Ready</SelectItem>
                  <SelectItem value={String(TaxFilingStatus.FILED)}>Filed</SelectItem>
                  <SelectItem value={String(TaxFilingStatus.EXCLUDED)}>Excluded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-selected-period">Assign Ready Items To</Label>
              <Select
                value={selectedPeriodId || 'all'}
                onValueChange={(value) => setSelectedPeriodId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="tax-selected-period">
                  <SelectValue placeholder="Choose a filing period first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No selected period</SelectItem>
                  {filingPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            mode="client"
            data={taxItems}
            columns={itemColumns}
            loading={isLoadingItems}
            showSearch
            searchPlaceholder="Search tax journal items"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      <ReasonDialog
        open={Boolean(excludingRow)}
        title="Exclude Tax Item"
        label="Exclusion Reason"
        description="Excluded items remain visible for audit. Use a clear operational reason for the exclusion."
        confirmLabel="Exclude Item"
        loading={isExcluding}
        onClose={() => setExcludingRow(null)}
        onConfirm={async (reason) => {
          if (!excludingRow || !user?.id) return;
          await runTaxAction(
            () =>
              excludeTaxItem({
                id: excludingRow.id,
                reason,
                actedByUserId: user.id,
              }).unwrap(),
            'Tax item excluded from filing set',
            'Failed to exclude tax item',
          );
          setExcludingRow(null);
        }}
      />
    </div>
  );
}
