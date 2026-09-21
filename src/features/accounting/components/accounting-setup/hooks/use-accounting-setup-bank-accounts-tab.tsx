import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountClass } from '@/db/schemas/enums';
import type { AuthUser } from '@/stores/auth-store';
import {
  type CompanyBankAccountMutationInput,
  type CompanyBankAccountRow,
  useCreateCompanyBankAccountMutation,
  useDeleteCompanyBankAccountMutation,
  useListAccountsQuery,
  useListCompanyBankAccountsQuery,
  useUpdateCompanyBankAccountMutation,
} from '../../../api';
import { StatusBadge } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import { createEmptyBankAccountForm } from '../utils/accounting-setup-utils';

export function useAccountingSetupBankAccountsTab({
  companyId,
  access,
  user: _user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const [bankAccountForm, setBankAccountForm] = useState(() =>
    createEmptyBankAccountForm(companyId),
  );
  const [editingBankAccountId, setEditingBankAccountId] = useState<string | null>(null);

  const { data: accounts = [] } = useListAccountsQuery(
    { companyId },
    { skip: !companyId || !access.canRead },
  );
  const {
    data: companyBankAccounts = [],
    isFetching,
    refetch,
  } = useListCompanyBankAccountsQuery({ companyId }, { skip: !companyId || !access.canRead });

  const [createCompanyBankAccount, { isLoading: isCreatingCompanyBankAccount }] =
    useCreateCompanyBankAccountMutation();
  const [updateCompanyBankAccount, { isLoading: isUpdatingCompanyBankAccount }] =
    useUpdateCompanyBankAccountMutation();
  const [deleteCompanyBankAccount, { isLoading: isDeletingCompanyBankAccount }] =
    useDeleteCompanyBankAccountMutation();

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, `${account.code} - ${account.name}`])),
    [accounts],
  );

  const postableAssetAccounts = accounts.filter(
    (account) =>
      account.active && account.isPostable && account.accountClass === AccountClass.ASSET,
  );

  function resetBankAccountForm() {
    setEditingBankAccountId(null);
    setBankAccountForm(createEmptyBankAccountForm(companyId));
  }

  function handleEditBankAccount(account: CompanyBankAccountRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit company bank accounts');
      return;
    }

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

  async function handleSaveBankAccount() {
    if (editingBankAccountId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingBankAccountId
          ? 'You do not have permission to update company bank accounts'
          : 'You do not have permission to create company bank accounts',
      );
      return;
    }

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
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save company bank account');
    }
  }

  async function handleDeleteBankAccount() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete company bank accounts');
      return;
    }

    if (!companyId || !editingBankAccountId) {
      toast.error('Select a company bank account first');
      return;
    }

    if (!globalThis.confirm('Delete this company bank account?')) return;

    try {
      await deleteCompanyBankAccount({ id: editingBankAccountId, companyId }).unwrap();
      toast.success('Company bank account deleted');
      resetBankAccountForm();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete company bank account');
    }
  }

  const columns = useMemo<ColumnDef<CompanyBankAccountRow>[]>(
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!access.canUpdate}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditBankAccount(row.original)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [access.canUpdate, accountNameById],
  );

  return {
    access,
    bankAccountForm,
    columns,
    companyBankAccounts,
    editingBankAccountId,
    isCreatingCompanyBankAccount,
    isDeletingCompanyBankAccount,
    isFetching,
    isUpdatingCompanyBankAccount,
    postableAssetAccounts,
    resetBankAccountForm,
    setBankAccountForm,
    handleDeleteBankAccount,
    handleSaveBankAccount,
  };
}
