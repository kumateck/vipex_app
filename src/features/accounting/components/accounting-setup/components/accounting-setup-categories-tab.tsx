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
} from '@/components/ui/select-searchable';
import type { AuthUser } from '@/stores/auth-store';
import { useAccountingSetupCategoriesTab } from '../hooks/use-accounting-setup-categories-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupCategoriesTab({
  companyId,
  access,
  user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const tab = useAccountingSetupCategoriesTab({ companyId, access, user });

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.editingExpenseCategoryId ? 'Edit Expense Category' : 'New Expense Category'}
            </CardTitle>
            <CardDescription>
              Map each expense category to the ledger account that should receive its postings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="expense-category-code">Code</Label>
                <Input
                  id="expense-category-code"
                  value={tab.expenseCategoryForm.code}
                  onChange={(event) =>
                    tab.setExpenseCategoryForm((current) => ({
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
                  value={tab.expenseCategoryForm.name}
                  onChange={(event) =>
                    tab.setExpenseCategoryForm((current) => ({
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
                  value={tab.expenseCategoryForm.accountId || undefined}
                  onValueChange={(value) =>
                    tab.setExpenseCategoryForm((current) => ({ ...current, accountId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an expense account" />
                  </SelectTrigger>
                  <SelectContent>
                    {tab.postableExpenseAccounts.map((account) => (
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
                  value={String(tab.expenseCategoryForm.active)}
                  onValueChange={(value) =>
                    tab.setExpenseCategoryForm((current) => ({
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
                onClick={() => void tab.handleSaveExpenseCategory()}
                disabled={
                  tab.isCreatingExpenseCategory ||
                  tab.isUpdatingExpenseCategory ||
                  (tab.editingExpenseCategoryId ? !tab.access.canUpdate : !tab.access.canCreate)
                }
              >
                {tab.editingExpenseCategoryId ? 'Update Category' : 'Create Category'}
              </Button>
              {tab.editingExpenseCategoryId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => void tab.handleDeleteExpenseCategory()}
                  disabled={tab.isDeletingExpenseCategory}
                >
                  Delete Category
                </Button>
              ) : null}
              <Button variant="outline" onClick={tab.resetExpenseCategoryForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {tab.editingExpenseCategoryId ? (
          <AccountingSetupHistoryCard
            entityType="expense_category"
            entityId={tab.editingExpenseCategoryId}
            entityLabel="Expense Category"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>
            These categories drive the approval workflow and determine which expense account is
            debited when a request is posted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="client"
            data={tab.expenseCategories}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search expense categories"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
