import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { BranchType, ExpenseFundingSource, ExpenseRequestStatus } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { PermissionKeys } from '@/shared/permissions/constants';
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
} from '../../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  expenseStatusLabel,
  formatDateTime,
  formatMoney,
  fundingSourceLabel,
  QuickAmountInput,
  ReasonDialog,
  StatusBadge,
} from '../accounting-shared';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

type ExpensesPageView = 'main' | 'drafts' | 'approvals' | 'payments' | 'posting' | 'history';

export function AccountingExpensesPage({ view = 'main' }: { view?: ExpensesPageView }) {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canAccessExpenses =
    permissions.has(PermissionKeys.CanReadAccounting) ||
    permissions.has(PermissionKeys.CanCreateExpenseRequest) ||
    permissions.has(PermissionKeys.CanSubmitExpenseRequest) ||
    permissions.has(PermissionKeys.CanApproveExpenseRequest) ||
    permissions.has(PermissionKeys.CanRejectExpenseRequest) ||
    permissions.has(PermissionKeys.CanPayExpenseRequest) ||
    permissions.has(PermissionKeys.CanPostExpenseRequest);
  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }
  if (!canAccessExpenses) {
    return (
      <AccountingUnauthorizedState
        title="Expense Workflow Restricted"
        description="Your role does not include permission to process expense workflow actions."
      />
    );
  }

  return <AccountingExpensesPageContent user={user} view={view} />;
}

export function AccountingExpensesDraftsPage() {
  return <AccountingExpensesPage view="drafts" />;
}

export function AccountingExpensesApprovalsPage() {
  return <AccountingExpensesPage view="approvals" />;
}

export function AccountingExpensesPaymentsPage() {
  return <AccountingExpensesPage view="payments" />;
}

export function AccountingExpensesPostingPage() {
  return <AccountingExpensesPage view="posting" />;
}

export function AccountingExpensesHistoryPage() {
  return <AccountingExpensesPage view="history" />;
}

function AccountingExpensesPageContent({ user, view }: { user: AuthUser; view: ExpensesPageView }) {
  const companyId = user.company?.id ?? '';
  const defaultBranchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user?.branch?.id ?? '';

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
    if (!companyId || !effectiveBranchId || !user?.id) {
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
      toast.error(error instanceof Error ? error.message : 'Failed to create expense request');
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
      toast.error(error instanceof Error ? error.message : failureMessage);
    }
  }

  const columns = useMemo<ColumnDef<ExpenseRequestRow>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Recorded',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) =>
          expenseCategoryNameById.get(row.expenseCategoryId) ?? row.expenseCategoryId,
      },
      {
        id: 'purpose',
        header: 'Purpose',
        accessorFn: (row) => row.purpose,
      },
      {
        id: 'fundingSource',
        header: 'Funding',
        accessorFn: (row) => fundingSourceLabel(row.fundingSource),
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) => formatMoney(row.amountPsw),
      },
      {
        id: 'bankAccount',
        header: 'Bank',
        accessorFn: (row) =>
          row.companyBankAccountId
            ? (bankNameById.get(row.companyBankAccountId) ?? row.companyBankAccountId)
            : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.status === ExpenseRequestStatus.POSTED
              ? 'default'
              : row.original.status === ExpenseRequestStatus.REJECTED
                ? 'outline'
                : 'secondary';
          return <StatusBadge label={expenseStatusLabel(row.original.status)} tone={tone} />;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canSubmit = row.original.status === ExpenseRequestStatus.RECORDED;
          const canApprove = row.original.status === ExpenseRequestStatus.SUBMITTED;
          const canReject = row.original.status === ExpenseRequestStatus.SUBMITTED;
          const canPay = row.original.status === ExpenseRequestStatus.APPROVED;
          const canPost = row.original.status === ExpenseRequestStatus.PAID;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canSubmit && !canApprove && !canReject && !canPay && !canPost}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canSubmit ? (
                  <DropdownMenuItem
                    disabled={isMutating}
                    onClick={() => {
                      void runExpenseAction(
                        () => submitExpenseRequest({ id: row.original.id }).unwrap(),
                        'Expense request submitted',
                        'Failed to submit expense request',
                      );
                    }}
                  >
                    Submit
                  </DropdownMenuItem>
                ) : null}
                {canApprove ? (
                  <DropdownMenuItem
                    disabled={isMutating || !user?.id}
                    onClick={() => {
                      void runExpenseAction(
                        () =>
                          approveExpenseRequest({
                            id: row.original.id,
                            approvedByUserId: user?.id ?? '',
                            approvalReason: 'Approved from accounting screen',
                          }).unwrap(),
                        'Expense request approved',
                        'Failed to approve expense request',
                      );
                    }}
                  >
                    Approve
                  </DropdownMenuItem>
                ) : null}
                {canReject ? (
                  <DropdownMenuItem
                    disabled={isMutating}
                    onClick={() => {
                      setRejectingRow(row.original);
                    }}
                  >
                    Reject
                  </DropdownMenuItem>
                ) : null}
                {canPay ? (
                  <DropdownMenuItem
                    disabled={isMutating || !user?.id}
                    onClick={() => {
                      void runExpenseAction(
                        () =>
                          payExpenseRequest({
                            id: row.original.id,
                            paidByUserId: user?.id ?? '',
                            companyBankAccountId:
                              row.original.fundingSource === ExpenseFundingSource.COMPANY_BANK
                                ? row.original.companyBankAccountId || companyBankAccountId || null
                                : null,
                          }).unwrap(),
                        'Expense request marked as paid',
                        'Failed to mark expense request as paid',
                      );
                    }}
                  >
                    Pay
                  </DropdownMenuItem>
                ) : null}
                {canPost ? (
                  <DropdownMenuItem
                    disabled={isMutating || !user?.id}
                    onClick={() => {
                      void runExpenseAction(
                        () =>
                          postExpenseRequest({
                            id: row.original.id,
                            postedBy: user?.id ?? '',
                          }).unwrap(),
                        'Expense request posted to ledger',
                        'Failed to post expense request',
                      );
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
    [
      approveExpenseRequest,
      bankNameById,
      companyBankAccountId,
      expenseCategoryNameById,
      isMutating,
      payExpenseRequest,
      postExpenseRequest,
      submitExpenseRequest,
      user?.id,
    ],
  );

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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Requests</CardDescription>
                <CardTitle>{formatMoney(totalRequestedPsw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Awaiting Action</CardDescription>
                <CardTitle>{pendingCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Company Bank Accounts</CardDescription>
                <CardTitle>{bankAccounts.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {view === 'main' ? (
            <Card>
              <CardHeader>
                <CardTitle>Record Expense Request</CardTitle>
                <CardDescription>
                  Choose the funding source carefully. Sales cash and company bank expenses should
                  still follow approval before posting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-branch">Branch</Label>
                    {isHeadOffice ? (
                      <Select
                        value={branchId}
                        onValueChange={(value) => {
                          setBranchId(value);
                          setLocationId('');
                        }}
                      >
                        <SelectTrigger id="expense-branch">
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
                    <Label htmlFor="expense-location">Location</Label>
                    <Select
                      value={locationId || 'branch'}
                      onValueChange={(value) => setLocationId(value === 'branch' ? '' : value)}
                    >
                      <SelectTrigger id="expense-location">
                        <SelectValue placeholder="Branch level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branch">Branch Level</SelectItem>
                        {locationOptions.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Expense Category</Label>
                    <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                      <SelectTrigger id="expense-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-source">Funding Source</Label>
                    <Select value={fundingSource} onValueChange={setFundingSource}>
                      <SelectTrigger id="expense-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(ExpenseFundingSource.PETTY_CASH)}>
                          Petty Cash
                        </SelectItem>
                        <SelectItem value={String(ExpenseFundingSource.SALES_CASH)}>
                          Sales Cash
                        </SelectItem>
                        <SelectItem value={String(ExpenseFundingSource.COMPANY_BANK)}>
                          Company Bank
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <QuickAmountInput
                    id="expense-amount"
                    label="Amount (GHS)"
                    value={amountCedis}
                    onChange={setAmountCedis}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="expense-reference">Reference No.</Label>
                    <Input
                      id="expense-reference"
                      value={referenceNo}
                      onChange={(event) => setReferenceNo(event.target.value)}
                      placeholder="Receipt, requisition, or memo no."
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <Label htmlFor="expense-bank">Company Bank Account</Label>
                    <Select
                      value={companyBankAccountId || 'none'}
                      onValueChange={(value) =>
                        setCompanyBankAccountId(value === 'none' ? '' : value)
                      }
                    >
                      <SelectTrigger id="expense-bank">
                        <SelectValue placeholder="Required when company bank is used" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not selected</SelectItem>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-4">
                    <Label htmlFor="expense-purpose">Purpose</Label>
                    <Textarea
                      id="expense-purpose"
                      rows={3}
                      value={purpose}
                      onChange={(event) => setPurpose(event.target.value)}
                      placeholder="Describe what the expense is for"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleCreate()}
                    disabled={isMutating || !effectiveBranchId}
                  >
                    Record Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {view !== 'main' ? (
            <Card>
              <CardHeader>
                <CardTitle>{pageTitle}</CardTitle>
                <CardDescription>{pageDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={tableRows}
                  columns={columns}
                  loading={isFetching}
                  showSearch
                  searchPlaceholder="Search expense requests"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          ) : null}

          {view === 'main' ? (
            <Card>
              <CardHeader>
                <CardTitle>Expense Workflow Pages</CardTitle>
                <CardDescription>
                  Expense stages are now split into standalone pages for faster processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Navigate to `Expenses / Drafts`, `Expenses / Approvals`, `Expenses / Payments`,
                  `Expenses / Posting`, and `Expenses / History` from the Accounting menu.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </ScrollableWrapper>

      <ReasonDialog
        open={Boolean(rejectingRow)}
        title="Reject Expense Request"
        label="Rejection Reason"
        description="Rejected requests remain visible in accounting, so add a clear reason for the audit trail."
        confirmLabel="Reject Request"
        loading={isRejecting}
        onClose={() => setRejectingRow(null)}
        onConfirm={async (reason) => {
          if (!rejectingRow || !user?.id) return;
          await runExpenseAction(
            () =>
              rejectExpenseRequest({
                id: rejectingRow.id,
                approvedByUserId: user.id,
                rejectionReason: reason,
              }).unwrap(),
            'Expense request rejected',
            'Failed to reject expense request',
          );
          setRejectingRow(null);
        }}
      />
    </div>
  );
}
