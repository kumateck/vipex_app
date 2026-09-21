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
  type ExpenseCategoryMutationInput,
  type ExpenseCategoryRow,
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useListAccountsQuery,
  useListExpenseCategoriesQuery,
  useUpdateExpenseCategoryMutation,
} from '../../../api';
import { StatusBadge } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import { createEmptyExpenseCategoryForm } from '../utils/accounting-setup-utils';

export function useAccountingSetupCategoriesTab({
  companyId,
  access,
  user: _user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const [expenseCategoryForm, setExpenseCategoryForm] = useState(() =>
    createEmptyExpenseCategoryForm(companyId),
  );
  const [editingExpenseCategoryId, setEditingExpenseCategoryId] = useState<string | null>(null);

  const { data: accounts = [] } = useListAccountsQuery(
    { companyId },
    { skip: !companyId || !access.canRead },
  );
  const {
    data: expenseCategories = [],
    isFetching,
    refetch,
  } = useListExpenseCategoriesQuery({ companyId }, { skip: !companyId || !access.canRead });

  const [createExpenseCategory, { isLoading: isCreatingExpenseCategory }] =
    useCreateExpenseCategoryMutation();
  const [updateExpenseCategory, { isLoading: isUpdatingExpenseCategory }] =
    useUpdateExpenseCategoryMutation();
  const [deleteExpenseCategory, { isLoading: isDeletingExpenseCategory }] =
    useDeleteExpenseCategoryMutation();

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, `${account.code} - ${account.name}`])),
    [accounts],
  );

  const postableExpenseAccounts = accounts.filter(
    (account) =>
      account.active && account.isPostable && account.accountClass === AccountClass.EXPENSE,
  );

  function resetExpenseCategoryForm() {
    setEditingExpenseCategoryId(null);
    setExpenseCategoryForm(createEmptyExpenseCategoryForm(companyId));
  }

  function handleEditExpenseCategory(category: ExpenseCategoryRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit expense categories');
      return;
    }

    setEditingExpenseCategoryId(category.id);
    setExpenseCategoryForm({
      companyId,
      code: category.code,
      name: category.name,
      accountId: category.accountId,
      active: category.active,
    });
  }

  async function handleSaveExpenseCategory() {
    if (editingExpenseCategoryId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingExpenseCategoryId
          ? 'You do not have permission to update expense categories'
          : 'You do not have permission to create expense categories',
      );
      return;
    }

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
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save expense category');
    }
  }

  async function handleDeleteExpenseCategory() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete expense categories');
      return;
    }

    if (!companyId || !editingExpenseCategoryId) {
      toast.error('Select an expense category first');
      return;
    }

    if (!globalThis.confirm('Delete this expense category?')) return;

    try {
      await deleteExpenseCategory({ id: editingExpenseCategoryId, companyId }).unwrap();
      toast.success('Expense category deleted');
      resetExpenseCategoryForm();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete expense category');
    }
  }

  const columns = useMemo<ColumnDef<ExpenseCategoryRow>[]>(
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
              <DropdownMenuItem onClick={() => handleEditExpenseCategory(row.original)}>
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
    columns,
    editingExpenseCategoryId,
    expenseCategories,
    expenseCategoryForm,
    isCreatingExpenseCategory,
    isDeletingExpenseCategory,
    isFetching,
    isUpdatingExpenseCategory,
    postableExpenseAccounts,
    resetExpenseCategoryForm,
    setExpenseCategoryForm,
    handleDeleteExpenseCategory,
    handleSaveExpenseCategory,
  };
}
