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
  type AccountMutationInput,
  type AccountRow,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useListAccountsQuery,
  useUpdateAccountMutation,
} from '../../../api';
import { StatusBadge } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import { accountClassLabel, createEmptyAccountForm } from '../utils/accounting-setup-utils';

export function useAccountingSetupAccountsTab({
  companyId,
  access,
  user: _user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const [accountForm, setAccountForm] = useState(() => createEmptyAccountForm(companyId));
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [removeLinkedCategoryOnDelete, setRemoveLinkedCategoryOnDelete] = useState(false);

  const {
    data: accounts = [],
    isFetching,
    refetch,
  } = useListAccountsQuery({ companyId }, { skip: !companyId || !access.canRead });

  const [createAccount, { isLoading: isCreatingAccount }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdatingAccount }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, `${account.code} - ${account.name}`])),
    [accounts],
  );

  const parentAccountOptions = accounts.filter((account) => account.active);
  const canLinkExpenseCategory =
    accountForm.accountClass === AccountClass.EXPENSE && Boolean(accountForm.isPostable);

  function resetAccountForm() {
    setEditingAccountId(null);
    setRemoveLinkedCategoryOnDelete(false);
    setAccountForm(createEmptyAccountForm(companyId));
  }

  function handleEditAccount(account: AccountRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit accounts');
      return;
    }

    setEditingAccountId(account.id);
    setRemoveLinkedCategoryOnDelete(false);
    setAccountForm({
      companyId,
      code: account.code,
      name: account.name,
      label: account.label ?? '',
      accountClass: account.accountClass,
      parentAccountId: account.parentAccountId ?? null,
      isPostable: account.isPostable,
      active: account.active,
      syncLinkedCategory: true,
    });
  }

  async function handleSaveAccount() {
    if (editingAccountId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingAccountId
          ? 'You do not have permission to update accounts'
          : 'You do not have permission to create accounts',
      );
      return;
    }

    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: AccountMutationInput = {
      ...accountForm,
      companyId,
      code: accountForm.code.trim(),
      name: accountForm.name.trim(),
      label: accountForm.label?.trim() || null,
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
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save account');
    }
  }

  async function handleDeleteAccount() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete accounts');
      return;
    }
    if (!companyId || !editingAccountId) {
      toast.error('Select an account first');
      return;
    }

    try {
      await deleteAccount({
        id: editingAccountId,
        companyId,
        removeLinkedCategory: removeLinkedCategoryOnDelete,
      }).unwrap();
      toast.success('Account deleted');
      setIsDeleteAccountDialogOpen(false);
      resetAccountForm();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  }

  const columns = useMemo<ColumnDef<AccountRow>[]>(
    () => [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'label', header: 'Label', cell: ({ row }) => row.original.label || '-' },
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
              <DropdownMenuItem onClick={() => handleEditAccount(row.original)}>
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
    accountForm,
    accounts,
    canLinkExpenseCategory,
    columns,
    companyId,
    editingAccountId,
    isCreatingAccount,
    isDeleteAccountDialogOpen,
    isDeletingAccount,
    isFetching,
    isUpdatingAccount,
    parentAccountOptions,
    removeLinkedCategoryOnDelete,
    resetAccountForm,
    setAccountForm,
    setIsDeleteAccountDialogOpen,
    setRemoveLinkedCategoryOnDelete,
    handleDeleteAccount,
    handleSaveAccount,
  };
}
