import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountClass, ExpenseFundingSource } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { useGetEntityAuditHistoryQuery } from '@/features/audit/api';
import {
  type AccountMutationInput,
  type AccountRow,
  type ApprovalPolicyMutationInput,
  type ApprovalPolicyRow,
  type CompanyBankAccountMutationInput,
  type CompanyBankAccountRow,
  type ExpenseCategoryMutationInput,
  type ExpenseCategoryRow,
  type TaxComponentMutationInput,
  type TaxComponentRow,
  type TaxProfileMutationInput,
  type TaxProfileRow,
  useCreateAccountMutation,
  useCreateApprovalPolicyMutation,
  useCreateCompanyBankAccountMutation,
  useCreateExpenseCategoryMutation,
  useCreateTaxComponentMutation,
  useCreateTaxProfileMutation,
  useDeleteAccountMutation,
  useListAccountsQuery,
  useListApprovalPoliciesQuery,
  useListCompanyBankAccountsQuery,
  useListExpenseCategoriesQuery,
  useListTaxComponentsQuery,
  useListTaxProfilesQuery,
  useUpdateAccountMutation,
  useUpdateApprovalPolicyMutation,
  useUpdateCompanyBankAccountMutation,
  useUpdateExpenseCategoryMutation,
  useUpdateTaxComponentMutation,
  useUpdateTaxProfileMutation,
} from '../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  formatMoney,
  fundingSourceLabel,
  StatusBadge,
} from './accounting-shared';

const NO_PARENT = '__none__';
const ALL_FUNDING_SOURCES = '__all__';

const ACCOUNT_CLASS_OPTIONS = [
  { value: String(AccountClass.ASSET), label: 'Asset' },
  { value: String(AccountClass.LIABILITY), label: 'Liability' },
  { value: String(AccountClass.EQUITY), label: 'Equity' },
  { value: String(AccountClass.INCOME), label: 'Income' },
  { value: String(AccountClass.EXPENSE), label: 'Expense' },
];

const FUNDING_SOURCE_OPTIONS = [
  { value: ALL_FUNDING_SOURCES, label: 'All funding sources' },
  { value: String(ExpenseFundingSource.PETTY_CASH), label: 'Petty Cash' },
  { value: String(ExpenseFundingSource.SALES_CASH), label: 'Sales Cash' },
  { value: String(ExpenseFundingSource.COMPANY_BANK), label: 'Company Bank' },
];

function accountClassLabel(accountClass: number) {
  switch (accountClass) {
    case AccountClass.ASSET:
      return 'Asset';
    case AccountClass.LIABILITY:
      return 'Liability';
    case AccountClass.EQUITY:
      return 'Equity';
    case AccountClass.INCOME:
      return 'Income';
    case AccountClass.EXPENSE:
      return 'Expense';
    default:
      return `Class ${accountClass}`;
  }
}

function parseDateInputValue(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEmptyAccountForm(companyId: string): AccountMutationInput {
  return {
    companyId,
    code: '',
    name: '',
    accountClass: AccountClass.ASSET,
    parentAccountId: null,
    isPostable: true,
    active: true,
  };
}

function createEmptyExpenseCategoryForm(companyId: string): ExpenseCategoryMutationInput {
  return {
    companyId,
    code: '',
    name: '',
    accountId: '',
    active: true,
  };
}

function createEmptyApprovalPolicyForm(companyId: string) {
  return {
    companyId,
    policyCode: '',
    name: '',
    amountLimitCedis: '',
    requiresHeadOfficeApproval: false,
    appliesToFundingSource: ALL_FUNDING_SOURCES,
    active: true,
  };
}

function createEmptyBankAccountForm(companyId: string): CompanyBankAccountMutationInput {
  return {
    companyId,
    accountId: '',
    name: '',
    bankName: '',
    branchName: '',
    accountNumberMasked: '',
    active: true,
  };
}

function createEmptyTaxProfileForm(companyId: string): TaxProfileMutationInput {
  return {
    companyId,
    name: '',
    active: true,
  };
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyTaxComponentForm(companyId: string, profileId = ''): TaxComponentMutationInput {
  return {
    companyId,
    profileId,
    key: '',
    numerator: 0,
    denominator: 1,
    inclusive: true,
    sortOrder: 0,
    startsAt: todayDateValue(),
    endsAt: null,
    active: true,
  };
}

function parseMoneyToPesewas(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function formatAuditDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function stringifyAuditMetadata(metadata: unknown) {
  if (metadata == null) return null;
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

function AccountingSetupHistoryCard({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: string;
  entityId: string;
  entityLabel: string;
}) {
  const { data, isFetching, isError } = useGetEntityAuditHistoryQuery(
    { entityType, entityId },
    { skip: !entityId },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
        <CardDescription>
          Review the audit trail for this {entityLabel.toLowerCase()} without leaving accounting
          setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            Unable to load change history for this {entityLabel.toLowerCase()} right now.
          </p>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No setup changes have been recorded for this {entityLabel.toLowerCase()} yet.
          </p>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-4">
              {data?.data.map((entry) => {
                const metadata = stringifyAuditMetadata(entry.metadata);
                return (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{entry.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatAuditDateTime(entry.createdAt)}
                      </span>
                    </div>
                    {entry.message ? (
                      <p className="mt-2 text-sm font-medium">{entry.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Actor: {entry.actorUserId || 'System'}
                    </p>
                    {metadata ? (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all">
                        {metadata}
                      </pre>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountingSetupPage() {
  const user = useAuthStore((state) => state.user);
  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }
  if (!user.permissions?.includes(PermissionKeys.CanManageAccountingSetup)) {
    return (
      <AccountingUnauthorizedState
        title="Accounting Setup Restricted"
        description="Your role does not include permission to manage accounting setup masters."
      />
    );
  }

  return <AccountingSetupPageContent user={user} />;
}

function AccountingSetupPageContent({ user }: { user: AuthUser }) {
  const companyId = user.company?.id ?? '';
  const [activeTab, setActiveTab] = useState('accounts');

  const [accountForm, setAccountForm] = useState(() => createEmptyAccountForm(companyId));
  const [expenseCategoryForm, setExpenseCategoryForm] = useState(() =>
    createEmptyExpenseCategoryForm(companyId),
  );
  const [approvalPolicyForm, setApprovalPolicyForm] = useState(() =>
    createEmptyApprovalPolicyForm(companyId),
  );
  const [bankAccountForm, setBankAccountForm] = useState(() =>
    createEmptyBankAccountForm(companyId),
  );
  const [taxProfileForm, setTaxProfileForm] = useState(() => createEmptyTaxProfileForm(companyId));
  const [selectedTaxProfileId, setSelectedTaxProfileId] = useState('');
  const [taxComponentForm, setTaxComponentForm] = useState(() =>
    createEmptyTaxComponentForm(companyId),
  );

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingExpenseCategoryId, setEditingExpenseCategoryId] = useState<string | null>(null);
  const [editingApprovalPolicyId, setEditingApprovalPolicyId] = useState<string | null>(null);
  const [editingBankAccountId, setEditingBankAccountId] = useState<string | null>(null);
  const [editingTaxProfileId, setEditingTaxProfileId] = useState<string | null>(null);
  const [editingTaxComponentId, setEditingTaxComponentId] = useState<string | null>(null);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);

  const {
    data: accounts = [],
    isFetching: isFetchingAccounts,
    refetch: refetchAccounts,
  } = useListAccountsQuery({ companyId }, { skip: !companyId });
  const {
    data: expenseCategories = [],
    isFetching: isFetchingExpenseCategories,
    refetch: refetchExpenseCategories,
  } = useListExpenseCategoriesQuery({ companyId }, { skip: !companyId });
  const {
    data: approvalPolicies = [],
    isFetching: isFetchingApprovalPolicies,
    refetch: refetchApprovalPolicies,
  } = useListApprovalPoliciesQuery({ companyId }, { skip: !companyId });
  const {
    data: companyBankAccounts = [],
    isFetching: isFetchingCompanyBankAccounts,
    refetch: refetchCompanyBankAccounts,
  } = useListCompanyBankAccountsQuery({ companyId }, { skip: !companyId });
  const {
    data: taxProfiles = [],
    isFetching: isFetchingTaxProfiles,
    refetch: refetchTaxProfiles,
  } = useListTaxProfilesQuery({ companyId }, { skip: !companyId });
  const effectiveTaxProfileId = selectedTaxProfileId || taxProfiles[0]?.id || '';
  const {
    data: taxComponents = [],
    isFetching: isFetchingTaxComponents,
    refetch: refetchTaxComponents,
  } = useListTaxComponentsQuery(
    { companyId, profileId: effectiveTaxProfileId || undefined },
    { skip: !companyId || !effectiveTaxProfileId },
  );

  const [createAccount, { isLoading: isCreatingAccount }] = useCreateAccountMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const [updateAccount, { isLoading: isUpdatingAccount }] = useUpdateAccountMutation();
  const [createExpenseCategory, { isLoading: isCreatingExpenseCategory }] =
    useCreateExpenseCategoryMutation();
  const [updateExpenseCategory, { isLoading: isUpdatingExpenseCategory }] =
    useUpdateExpenseCategoryMutation();
  const [createApprovalPolicy, { isLoading: isCreatingApprovalPolicy }] =
    useCreateApprovalPolicyMutation();
  const [updateApprovalPolicy, { isLoading: isUpdatingApprovalPolicy }] =
    useUpdateApprovalPolicyMutation();
  const [createCompanyBankAccount, { isLoading: isCreatingCompanyBankAccount }] =
    useCreateCompanyBankAccountMutation();
  const [updateCompanyBankAccount, { isLoading: isUpdatingCompanyBankAccount }] =
    useUpdateCompanyBankAccountMutation();
  const [createTaxProfile, { isLoading: isCreatingTaxProfile }] = useCreateTaxProfileMutation();
  const [updateTaxProfile, { isLoading: isUpdatingTaxProfile }] = useUpdateTaxProfileMutation();
  const [createTaxComponent, { isLoading: isCreatingTaxComponent }] =
    useCreateTaxComponentMutation();
  const [updateTaxComponent, { isLoading: isUpdatingTaxComponent }] =
    useUpdateTaxComponentMutation();

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, `${account.code} - ${account.name}`])),
    [accounts],
  );
  const postableExpenseAccounts = accounts.filter(
    (account) =>
      account.active && account.isPostable && account.accountClass === AccountClass.EXPENSE,
  );
  const postableAssetAccounts = accounts.filter(
    (account) =>
      account.active && account.isPostable && account.accountClass === AccountClass.ASSET,
  );
  const parentAccountOptions = accounts.filter((account) => account.active);

  function resetAccountForm() {
    setEditingAccountId(null);
    setAccountForm(createEmptyAccountForm(companyId));
  }

  function resetExpenseCategoryForm() {
    setEditingExpenseCategoryId(null);
    setExpenseCategoryForm(createEmptyExpenseCategoryForm(companyId));
  }

  function resetApprovalPolicyForm() {
    setEditingApprovalPolicyId(null);
    setApprovalPolicyForm(createEmptyApprovalPolicyForm(companyId));
  }

  function resetBankAccountForm() {
    setEditingBankAccountId(null);
    setBankAccountForm(createEmptyBankAccountForm(companyId));
  }

  function resetTaxProfileForm() {
    setEditingTaxProfileId(null);
    setTaxProfileForm(createEmptyTaxProfileForm(companyId));
  }

  function resetTaxComponentForm(profileId = effectiveTaxProfileId) {
    setEditingTaxComponentId(null);
    setTaxComponentForm(createEmptyTaxComponentForm(companyId, profileId));
  }

  function handleEditAccount(account: AccountRow) {
    setActiveTab('accounts');
    setEditingAccountId(account.id);
    setAccountForm({
      companyId,
      code: account.code,
      name: account.name,
      accountClass: account.accountClass,
      parentAccountId: account.parentAccountId ?? null,
      isPostable: account.isPostable,
      active: account.active,
    });
  }

  function handleEditExpenseCategory(category: ExpenseCategoryRow) {
    setActiveTab('categories');
    setEditingExpenseCategoryId(category.id);
    setExpenseCategoryForm({
      companyId,
      code: category.code,
      name: category.name,
      accountId: category.accountId,
      active: category.active,
    });
  }

  function handleEditApprovalPolicy(policy: ApprovalPolicyRow) {
    setActiveTab('policies');
    setEditingApprovalPolicyId(policy.id);
    setApprovalPolicyForm({
      companyId,
      policyCode: policy.policyCode,
      name: policy.name,
      amountLimitCedis: ((policy.amountLimitPsw ?? 0) / 100).toFixed(2),
      requiresHeadOfficeApproval: policy.requiresHeadOfficeApproval,
      appliesToFundingSource:
        policy.appliesToFundingSource == null
          ? ALL_FUNDING_SOURCES
          : String(policy.appliesToFundingSource),
      active: policy.active,
    });
  }

  function handleEditBankAccount(account: CompanyBankAccountRow) {
    setActiveTab('bank-accounts');
    setEditingBankAccountId(account.id);
    setBankAccountForm({
      companyId,
      accountId: account.accountId,
      name: account.name,
      bankName: account.bankName ?? '',
      branchName: account.branchName ?? '',
      accountNumberMasked: account.accountNumberMasked ?? '',
      active: account.active,
    });
  }

  function handleEditTaxProfile(profile: TaxProfileRow) {
    setActiveTab('tax-profiles');
    setSelectedTaxProfileId(profile.id);
    setEditingTaxProfileId(profile.id);
    setTaxProfileForm({
      companyId,
      name: profile.name,
      active: profile.active,
    });
  }

  function handleEditTaxComponent(component: TaxComponentRow) {
    setActiveTab('tax-components');
    setSelectedTaxProfileId(component.profileId);
    setEditingTaxComponentId(component.id);
    setTaxComponentForm({
      companyId,
      profileId: component.profileId,
      key: component.key,
      numerator: component.numerator,
      denominator: component.denominator,
      inclusive: component.inclusive,
      sortOrder: component.sortOrder,
      startsAt: component.startsAt.slice(0, 10),
      endsAt: component.endsAt ? component.endsAt.slice(0, 10) : null,
      active: component.active,
    });
  }

  async function handleSaveAccount() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: AccountMutationInput = {
      ...accountForm,
      companyId,
      code: accountForm.code.trim(),
      name: accountForm.name.trim(),
      parentAccountId: accountForm.parentAccountId || null,
    };

    if (!payload.code || !payload.name) {
      toast.error('Account code and name are required');
      return;
    }

    try {
      if (editingAccountId) {
        await updateAccount({ id: editingAccountId, body: payload }).unwrap();
        toast.success('Account updated');
      } else {
        await createAccount(payload).unwrap();
        toast.success('Account created');
      }
      resetAccountForm();
      await refetchAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save account');
    }
  }

  async function handleDeleteAccount() {
    if (!companyId || !editingAccountId) {
      toast.error('Select an account first');
      return;
    }

    try {
      await deleteAccount({ id: editingAccountId, companyId }).unwrap();
      toast.success('Account deleted');
      setIsDeleteAccountDialogOpen(false);
      resetAccountForm();
      await refetchAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  }

  async function handleSaveExpenseCategory() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: ExpenseCategoryMutationInput = {
      ...expenseCategoryForm,
      companyId,
      code: expenseCategoryForm.code.trim(),
      name: expenseCategoryForm.name.trim(),
      accountId: expenseCategoryForm.accountId,
    };

    if (!payload.code || !payload.name || !payload.accountId) {
      toast.error('Category code, name, and mapped account are required');
      return;
    }

    try {
      if (editingExpenseCategoryId) {
        await updateExpenseCategory({ id: editingExpenseCategoryId, body: payload }).unwrap();
        toast.success('Expense category updated');
      } else {
        await createExpenseCategory(payload).unwrap();
        toast.success('Expense category created');
      }
      resetExpenseCategoryForm();
      await refetchExpenseCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense category');
    }
  }

  async function handleSaveApprovalPolicy() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const amountLimitPsw = parseMoneyToPesewas(approvalPolicyForm.amountLimitCedis);
    if (amountLimitPsw == null) {
      toast.error('Enter a valid amount limit');
      return;
    }

    const payload: ApprovalPolicyMutationInput = {
      companyId,
      policyCode: approvalPolicyForm.policyCode.trim(),
      name: approvalPolicyForm.name.trim(),
      amountLimitPsw,
      requiresHeadOfficeApproval: approvalPolicyForm.requiresHeadOfficeApproval,
      appliesToFundingSource:
        approvalPolicyForm.appliesToFundingSource === ALL_FUNDING_SOURCES
          ? null
          : Number(approvalPolicyForm.appliesToFundingSource),
      active: approvalPolicyForm.active,
    };

    if (!payload.policyCode || !payload.name) {
      toast.error('Policy code and name are required');
      return;
    }

    try {
      if (editingApprovalPolicyId) {
        await updateApprovalPolicy({ id: editingApprovalPolicyId, body: payload }).unwrap();
        toast.success('Approval policy updated');
      } else {
        await createApprovalPolicy(payload).unwrap();
        toast.success('Approval policy created');
      }
      resetApprovalPolicyForm();
      await refetchApprovalPolicies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save approval policy');
    }
  }

  async function handleSaveBankAccount() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: CompanyBankAccountMutationInput = {
      companyId,
      accountId: bankAccountForm.accountId,
      name: bankAccountForm.name.trim(),
      bankName: bankAccountForm.bankName?.trim() || null,
      branchName: bankAccountForm.branchName?.trim() || null,
      accountNumberMasked: bankAccountForm.accountNumberMasked?.trim() || null,
      active: bankAccountForm.active,
    };

    if (!payload.accountId || !payload.name) {
      toast.error('Mapped account and display name are required');
      return;
    }

    try {
      if (editingBankAccountId) {
        await updateCompanyBankAccount({ id: editingBankAccountId, body: payload }).unwrap();
        toast.success('Company bank account updated');
      } else {
        await createCompanyBankAccount(payload).unwrap();
        toast.success('Company bank account created');
      }
      resetBankAccountForm();
      await refetchCompanyBankAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save company bank account');
    }
  }

  async function handleSaveTaxProfile() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: TaxProfileMutationInput = {
      companyId,
      name: taxProfileForm.name.trim(),
      active: taxProfileForm.active,
    };

    if (!payload.name) {
      toast.error('Tax profile name is required');
      return;
    }

    try {
      if (editingTaxProfileId) {
        await updateTaxProfile({ id: editingTaxProfileId, body: payload }).unwrap();
        toast.success('Tax profile updated');
      } else {
        await createTaxProfile(payload).unwrap();
        toast.success('Tax profile created');
      }
      resetTaxProfileForm();
      await refetchTaxProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tax profile');
    }
  }

  async function handleSaveTaxComponent() {
    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }
    const payload: TaxComponentMutationInput = {
      ...taxComponentForm,
      companyId,
      profileId: taxComponentForm.profileId || effectiveTaxProfileId,
      key: taxComponentForm.key.trim(),
      startsAt: taxComponentForm.startsAt || todayDateValue(),
      endsAt: taxComponentForm.endsAt || null,
    };

    if (!payload.profileId || !payload.key) {
      toast.error('Tax profile and component key are required');
      return;
    }

    try {
      if (editingTaxComponentId) {
        await updateTaxComponent({ id: editingTaxComponentId, body: payload }).unwrap();
        toast.success('Tax component updated');
      } else {
        await createTaxComponent(payload).unwrap();
        toast.success('Tax component created');
      }
      resetTaxComponentForm(payload.profileId);
      await refetchTaxComponents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tax component');
    }
  }

  const accountColumns = useMemo<ColumnDef<AccountRow>[]>(
    () => [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Name' },
      {
        id: 'accountClass',
        header: 'Class',
        accessorFn: (row) => accountClassLabel(row.accountClass),
      },
      {
        id: 'parentAccount',
        header: 'Parent',
        accessorFn: (row) =>
          row.parentAccountId
            ? (accountNameById.get(row.parentAccountId) ?? row.parentAccountId)
            : '-',
      },
      {
        id: 'postable',
        header: 'Posting',
        cell: ({ row }) => (
          <StatusBadge label={row.original.isPostable ? 'Postable' : 'Summary'} tone="outline" />
        ),
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => handleEditAccount(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [accountNameById],
  );

  const expenseCategoryColumns = useMemo<ColumnDef<ExpenseCategoryRow>[]>(
    () => [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Category Name' },
      {
        id: 'account',
        header: 'Mapped Account',
        accessorFn: (row) => accountNameById.get(row.accountId) ?? row.accountId,
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditExpenseCategory(row.original)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [accountNameById],
  );

  const approvalPolicyColumns = useMemo<ColumnDef<ApprovalPolicyRow>[]>(
    () => [
      { accessorKey: 'policyCode', header: 'Code' },
      { accessorKey: 'name', header: 'Policy' },
      {
        id: 'amountLimit',
        header: 'Limit',
        accessorFn: (row) => formatMoney(row.amountLimitPsw),
      },
      {
        id: 'fundingSource',
        header: 'Funding Scope',
        accessorFn: (row) =>
          row.appliesToFundingSource == null
            ? 'All funding sources'
            : fundingSourceLabel(row.appliesToFundingSource),
      },
      {
        id: 'approval',
        header: 'Approval',
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.requiresHeadOfficeApproval ? 'Head Office' : 'Branch Allowed'}
            tone="outline"
          />
        ),
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditApprovalPolicy(row.original)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const companyBankAccountColumns = useMemo<ColumnDef<CompanyBankAccountRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Display Name' },
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'branchName', header: 'Bank Branch' },
      { accessorKey: 'accountNumberMasked', header: 'Account No.' },
      {
        id: 'ledger',
        header: 'Ledger Account',
        accessorFn: (row) => accountNameById.get(row.accountId) ?? row.accountId,
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => handleEditBankAccount(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [accountNameById],
  );

  const taxProfileColumns = useMemo<ColumnDef<TaxProfileRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Profile Name' },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => handleEditTaxProfile(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const taxComponentColumns = useMemo<ColumnDef<TaxComponentRow>[]>(
    () => [
      { accessorKey: 'key', header: 'Key' },
      {
        id: 'fraction',
        header: 'Fraction',
        accessorFn: (row) => `${row.numerator}/${row.denominator}`,
      },
      {
        id: 'inclusive',
        header: 'Inclusive',
        cell: ({ row }) => (
          <StatusBadge label={row.original.inclusive ? 'Inclusive' : 'Exclusive'} tone="outline" />
        ),
      },
      {
        accessorKey: 'sortOrder',
        header: 'Order',
      },
      {
        id: 'period',
        header: 'Effective Period',
        accessorFn: (row) =>
          `${row.startsAt.slice(0, 10)}${row.endsAt ? ` to ${row.endsAt.slice(0, 10)}` : ''}`,
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={row.original.active ? 'Active' : 'Inactive'} tone="secondary" />
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => handleEditTaxComponent(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounting Setup</h1>
          <p className="text-sm text-muted-foreground">
            Manage the accounting master data used by ledger posting, expense workflows, tax
            capture, and reporting. These settings are company-wide and only apply when accounting
            is enabled for the company.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{accounts.length} accounts</Badge>
          <Badge variant="outline">{expenseCategories.length} expense categories</Badge>
          <Badge variant="outline">{approvalPolicies.length} approval policies</Badge>
          <Badge variant="outline">{companyBankAccounts.length} bank accounts</Badge>
          <Badge variant="outline">{taxProfiles.length} tax profiles</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full gap-1 md:grid-cols-6">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="tax-profiles">Tax Profiles</TabsTrigger>
          <TabsTrigger value="tax-components">Tax Components</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{editingAccountId ? 'Edit Account' : 'New Account'}</CardTitle>
                  <CardDescription>
                    Set the account code, class, posting behavior, and whether the account is
                    active.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="account-code">Code</Label>
                      <Input
                        id="account-code"
                        value={accountForm.code}
                        onChange={(event) =>
                          setAccountForm((current) => ({ ...current, code: event.target.value }))
                        }
                        placeholder="4000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-name">Name</Label>
                      <Input
                        id="account-name"
                        value={accountForm.name}
                        onChange={(event) =>
                          setAccountForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Parcel Revenue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Class</Label>
                      <Select
                        value={String(accountForm.accountClass)}
                        onValueChange={(value) =>
                          setAccountForm((current) => ({
                            ...current,
                            accountClass: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account class" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_CLASS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Account</Label>
                      <Select
                        value={accountForm.parentAccountId ?? NO_PARENT}
                        onValueChange={(value) =>
                          setAccountForm((current) => ({
                            ...current,
                            parentAccountId: value === NO_PARENT ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional parent account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_PARENT}>No parent</SelectItem>
                          {parentAccountOptions
                            .filter((account) => account.id !== editingAccountId)
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Posting Type</Label>
                      <Select
                        value={String(accountForm.isPostable)}
                        onValueChange={(value) =>
                          setAccountForm((current) => ({
                            ...current,
                            isPostable: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Postable account</SelectItem>
                          <SelectItem value="false">Summary account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(accountForm.active)}
                        onValueChange={(value) =>
                          setAccountForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveAccount()}
                      disabled={isCreatingAccount || isUpdatingAccount}
                    >
                      {editingAccountId ? 'Update Account' : 'Create Account'}
                    </Button>
                    {editingAccountId ? (
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteAccountDialogOpen(true)}
                        disabled={isDeletingAccount}
                      >
                        Delete Account
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={resetAccountForm}>
                      Clear
                    </Button>
                  </div>
                  {editingAccountId ? (
                    <p className="text-xs text-muted-foreground">
                      Delete is only allowed when the account has no journal activity, no setup
                      mappings, no petty cash fund, and no child accounts.
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {editingAccountId ? (
                <AccountingSetupHistoryCard
                  entityType="accounting_account"
                  entityId={editingAccountId}
                  entityLabel="Account"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>
                  Review the configured chart of accounts and select a row to edit it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={accounts}
                  columns={accountColumns}
                  loading={isFetchingAccounts}
                  showSearch
                  searchPlaceholder="Search accounts"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingExpenseCategoryId ? 'Edit Expense Category' : 'New Expense Category'}
                  </CardTitle>
                  <CardDescription>
                    Map each expense category to the ledger account that should receive its
                    postings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="expense-category-code">Code</Label>
                      <Input
                        id="expense-category-code"
                        value={expenseCategoryForm.code}
                        onChange={(event) =>
                          setExpenseCategoryForm((current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        placeholder="FUEL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-category-name">Name</Label>
                      <Input
                        id="expense-category-name"
                        value={expenseCategoryForm.name}
                        onChange={(event) =>
                          setExpenseCategoryForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Fuel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mapped Account</Label>
                      <Select
                        value={expenseCategoryForm.accountId || undefined}
                        onValueChange={(value) =>
                          setExpenseCategoryForm((current) => ({ ...current, accountId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an expense account" />
                        </SelectTrigger>
                        <SelectContent>
                          {postableExpenseAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(expenseCategoryForm.active)}
                        onValueChange={(value) =>
                          setExpenseCategoryForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveExpenseCategory()}
                      disabled={isCreatingExpenseCategory || isUpdatingExpenseCategory}
                    >
                      {editingExpenseCategoryId ? 'Update Category' : 'Create Category'}
                    </Button>
                    <Button variant="outline" onClick={resetExpenseCategoryForm}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {editingExpenseCategoryId ? (
                <AccountingSetupHistoryCard
                  entityType="expense_category"
                  entityId={editingExpenseCategoryId}
                  entityLabel="Expense Category"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>
                  These categories drive the approval workflow and determine which expense account
                  is debited when a request is posted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={expenseCategories}
                  columns={expenseCategoryColumns}
                  loading={isFetchingExpenseCategories}
                  showSearch
                  searchPlaceholder="Search expense categories"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingApprovalPolicyId ? 'Edit Approval Policy' : 'New Approval Policy'}
                  </CardTitle>
                  <CardDescription>
                    Define spending thresholds and whether branch requests must move to head office
                    approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="policy-code">Policy Code</Label>
                      <Input
                        id="policy-code"
                        value={approvalPolicyForm.policyCode}
                        onChange={(event) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            policyCode: event.target.value,
                          }))
                        }
                        placeholder="PETTY_LIMIT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy-name">Name</Label>
                      <Input
                        id="policy-name"
                        value={approvalPolicyForm.name}
                        onChange={(event) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Branch petty cash limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy-amount-limit">Amount Limit (GHS)</Label>
                      <Input
                        id="policy-amount-limit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={approvalPolicyForm.amountLimitCedis}
                        onChange={(event) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            amountLimitCedis: event.target.value,
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Funding Scope</Label>
                      <Select
                        value={approvalPolicyForm.appliesToFundingSource}
                        onValueChange={(value) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            appliesToFundingSource: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUNDING_SOURCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Approval Level</Label>
                      <Select
                        value={String(approvalPolicyForm.requiresHeadOfficeApproval)}
                        onValueChange={(value) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            requiresHeadOfficeApproval: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Branch can approve</SelectItem>
                          <SelectItem value="true">Head office approval required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(approvalPolicyForm.active)}
                        onValueChange={(value) =>
                          setApprovalPolicyForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveApprovalPolicy()}
                      disabled={isCreatingApprovalPolicy || isUpdatingApprovalPolicy}
                    >
                      {editingApprovalPolicyId ? 'Update Policy' : 'Create Policy'}
                    </Button>
                    <Button variant="outline" onClick={resetApprovalPolicyForm}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {editingApprovalPolicyId ? (
                <AccountingSetupHistoryCard
                  entityType="accounting_approval_policy"
                  entityId={editingApprovalPolicyId}
                  entityLabel="Approval Policy"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Approval Policies</CardTitle>
                <CardDescription>
                  Policies here support petty cash, sales cash, and head-office approval decisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={approvalPolicies}
                  columns={approvalPolicyColumns}
                  loading={isFetchingApprovalPolicies}
                  showSearch
                  searchPlaceholder="Search approval policies"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank-accounts" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingBankAccountId
                      ? 'Edit Company Bank Account'
                      : 'New Company Bank Account'}
                  </CardTitle>
                  <CardDescription>
                    Register the head-office bank accounts that accounting and expense payments can
                    post against.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="bank-account-name">Display Name</Label>
                      <Input
                        id="bank-account-name"
                        value={bankAccountForm.name}
                        onChange={(event) =>
                          setBankAccountForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Main Operations Account"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mapped Ledger Account</Label>
                      <Select
                        value={bankAccountForm.accountId || undefined}
                        onValueChange={(value) =>
                          setBankAccountForm((current) => ({ ...current, accountId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset account" />
                        </SelectTrigger>
                        <SelectContent>
                          {postableAssetAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        value={bankAccountForm.bankName ?? ''}
                        onChange={(event) =>
                          setBankAccountForm((current) => ({
                            ...current,
                            bankName: event.target.value,
                          }))
                        }
                        placeholder="GCB Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-branch">Bank Branch</Label>
                      <Input
                        id="bank-branch"
                        value={bankAccountForm.branchName ?? ''}
                        onChange={(event) =>
                          setBankAccountForm((current) => ({
                            ...current,
                            branchName: event.target.value,
                          }))
                        }
                        placeholder="Head Office Branch"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-account-number">Masked Account Number</Label>
                      <Input
                        id="bank-account-number"
                        value={bankAccountForm.accountNumberMasked ?? ''}
                        onChange={(event) =>
                          setBankAccountForm((current) => ({
                            ...current,
                            accountNumberMasked: event.target.value,
                          }))
                        }
                        placeholder="****1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(bankAccountForm.active)}
                        onValueChange={(value) =>
                          setBankAccountForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveBankAccount()}
                      disabled={isCreatingCompanyBankAccount || isUpdatingCompanyBankAccount}
                    >
                      {editingBankAccountId ? 'Update Bank Account' : 'Create Bank Account'}
                    </Button>
                    <Button variant="outline" onClick={resetBankAccountForm}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {editingBankAccountId ? (
                <AccountingSetupHistoryCard
                  entityType="company_bank_account"
                  entityId={editingBankAccountId}
                  entityLabel="Bank Account"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Company Bank Accounts</CardTitle>
                <CardDescription>
                  These accounts represent company-level banking, not branch-level petty cash.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={companyBankAccounts}
                  columns={companyBankAccountColumns}
                  loading={isFetchingCompanyBankAccounts}
                  showSearch
                  searchPlaceholder="Search bank accounts"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax-profiles" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingTaxProfileId ? 'Edit Tax Profile' : 'New Tax Profile'}
                  </CardTitle>
                  <CardDescription>
                    Maintain the tax profiles that the Ghana tax engine can reference for posting
                    and filing review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="tax-profile-name">Name</Label>
                      <Input
                        id="tax-profile-name"
                        value={taxProfileForm.name}
                        onChange={(event) =>
                          setTaxProfileForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Ghana VAT Standard"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(taxProfileForm.active)}
                        onValueChange={(value) =>
                          setTaxProfileForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveTaxProfile()}
                      disabled={isCreatingTaxProfile || isUpdatingTaxProfile}
                    >
                      {editingTaxProfileId ? 'Update Tax Profile' : 'Create Tax Profile'}
                    </Button>
                    <Button variant="outline" onClick={resetTaxProfileForm}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {editingTaxProfileId ? (
                <AccountingSetupHistoryCard
                  entityType="tax_profile"
                  entityId={editingTaxProfileId}
                  entityLabel="Tax Profile"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tax Profiles</CardTitle>
                <CardDescription>
                  Profile names can be maintained here while the tax calculation engine remains
                  unchanged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={taxProfiles}
                  columns={taxProfileColumns}
                  loading={isFetchingTaxProfiles}
                  showSearch
                  searchPlaceholder="Search tax profiles"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax-components" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingTaxComponentId ? 'Edit Tax Component' : 'New Tax Component'}
                  </CardTitle>
                  <CardDescription>
                    Maintain the stored tax component rows for a profile. This keeps profile
                    metadata maintainable without changing the current Ghana tax calculation code
                    path.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tax Profile</Label>
                    <Select
                      value={taxComponentForm.profileId || effectiveTaxProfileId || undefined}
                      onValueChange={(value) => {
                        setSelectedTaxProfileId(value);
                        setTaxComponentForm((current) => ({ ...current, profileId: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="tax-component-key">Key</Label>
                      <Input
                        id="tax-component-key"
                        value={taxComponentForm.key}
                        onChange={(event) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            key: event.target.value,
                          }))
                        }
                        placeholder="VAT"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax-component-numerator">Numerator</Label>
                        <Input
                          id="tax-component-numerator"
                          type="number"
                          min="0"
                          step="1"
                          value={String(taxComponentForm.numerator)}
                          onChange={(event) =>
                            setTaxComponentForm((current) => ({
                              ...current,
                              numerator: Number(event.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-component-denominator">Denominator</Label>
                        <Input
                          id="tax-component-denominator"
                          type="number"
                          min="1"
                          step="1"
                          value={String(taxComponentForm.denominator)}
                          onChange={(event) =>
                            setTaxComponentForm((current) => ({
                              ...current,
                              denominator: Number(event.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-component-order">Sort Order</Label>
                      <Input
                        id="tax-component-order"
                        type="number"
                        min="0"
                        step="1"
                        value={String(taxComponentForm.sortOrder ?? 0)}
                        onChange={(event) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            sortOrder: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Charge Type</Label>
                      <Select
                        value={String(taxComponentForm.inclusive)}
                        onValueChange={(value) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            inclusive: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Inclusive</SelectItem>
                          <SelectItem value="false">Exclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-component-starts-at">Starts At</Label>
                      <DatePicker
                        date={parseDateInputValue(taxComponentForm.startsAt)}
                        onDateChange={(value) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            startsAt: toDateInputValue(value),
                          }))
                        }
                        placeholder="Select start date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-component-ends-at">Ends At</Label>
                      <DatePicker
                        date={parseDateInputValue(taxComponentForm.endsAt)}
                        onDateChange={(value) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            endsAt: value ? toDateInputValue(value) : null,
                          }))
                        }
                        placeholder="Select end date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={String(taxComponentForm.active)}
                        onValueChange={(value) =>
                          setTaxComponentForm((current) => ({
                            ...current,
                            active: value === 'true',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleSaveTaxComponent()}
                      disabled={
                        isCreatingTaxComponent ||
                        isUpdatingTaxComponent ||
                        !(taxComponentForm.profileId || effectiveTaxProfileId)
                      }
                    >
                      {editingTaxComponentId ? 'Update Tax Component' : 'Create Tax Component'}
                    </Button>
                    <Button variant="outline" onClick={() => resetTaxComponentForm()}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {editingTaxComponentId ? (
                <AccountingSetupHistoryCard
                  entityType="tax_component"
                  entityId={editingTaxComponentId}
                  entityLabel="Tax Component"
                />
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tax Components</CardTitle>
                <CardDescription>
                  Stored component rows for the selected profile. These records support profile
                  maintenance and payroll references while the current Ghana tax engine stays
                  intact.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Viewing Profile</Label>
                  <Select
                    value={effectiveTaxProfileId || undefined}
                    onValueChange={(value) => {
                      setSelectedTaxProfileId(value);
                      resetTaxComponentForm(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax profile to view components" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DataTable
                  mode="client"
                  data={taxComponents}
                  columns={taxComponentColumns}
                  loading={isFetchingTaxComponents}
                  showSearch
                  searchPlaceholder="Search tax components"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ledger account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected account. The delete will only succeed when the
              account has no journal transactions, setup mappings, petty cash links, or child
              accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingAccount}
              onClick={() => void handleDeleteAccount()}
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
