import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { DataTable } from '@/components/datatable';
import type { AuthUser } from '@/stores/auth-store';
import { AccountingSetupDeleteAccountDialog } from '../dialogs/accounting-setup-delete-account-dialog';
import { useAccountingSetupAccountsTab } from '../hooks/use-accounting-setup-accounts-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import { ACCOUNT_CLASS_OPTIONS, NO_PARENT } from '../utils/accounting-setup-utils';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupAccountsTab({
  companyId,
  access,
  user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const tab = useAccountingSetupAccountsTab({ companyId, access, user });

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{tab.editingAccountId ? 'Edit Account' : 'New Account'}</CardTitle>
            <CardDescription>
              Set the account code, class, posting behavior, and whether the account is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="account-code">Code</Label>
                <Input
                  id="account-code"
                  value={tab.accountForm.code}
                  onChange={(event) =>
                    tab.setAccountForm((current) => ({ ...current, code: event.target.value }))
                  }
                  placeholder="4000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">Name</Label>
                <Input
                  id="account-name"
                  value={tab.accountForm.name}
                  onChange={(event) =>
                    tab.setAccountForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Parcel Revenue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-label">Label (Category Name)</Label>
                <Input
                  id="account-label"
                  value={tab.accountForm.label ?? ''}
                  onChange={(event) =>
                    tab.setAccountForm((current) => ({ ...current, label: event.target.value }))
                  }
                  placeholder="Fuel"
                />
                <p className="text-xs text-muted-foreground">
                  Used as the linked expense category name when category sync is enabled.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Account Class</Label>
                <Select
                  value={String(tab.accountForm.accountClass)}
                  onValueChange={(value) =>
                    tab.setAccountForm((current) => ({ ...current, accountClass: Number(value) }))
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
                  value={tab.accountForm.parentAccountId ?? NO_PARENT}
                  onValueChange={(value) =>
                    tab.setAccountForm((current) => ({
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
                    {tab.parentAccountOptions
                      .filter((account) => account.id !== tab.editingAccountId)
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
                  value={String(tab.accountForm.isPostable)}
                  onValueChange={(value) =>
                    tab.setAccountForm((current) => ({ ...current, isPostable: value === 'true' }))
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
                  value={String(tab.accountForm.active)}
                  onValueChange={(value) =>
                    tab.setAccountForm((current) => ({ ...current, active: value === 'true' }))
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
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label className="block">Category Sync</Label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm">
                  <Checkbox
                    checked={Boolean(tab.accountForm.syncLinkedCategory)}
                    disabled={!tab.canLinkExpenseCategory}
                    onCheckedChange={(checked) =>
                      tab.setAccountForm((current) => ({
                        ...current,
                        syncLinkedCategory: checked === true,
                      }))
                    }
                  />
                  <span className="text-muted-foreground">
                    {tab.canLinkExpenseCategory
                      ? 'Keep linked expense category aligned with account code and label on save.'
                      : 'Enable for postable expense accounts to sync a linked expense category.'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void tab.handleSaveAccount()}
                disabled={
                  tab.isCreatingAccount ||
                  tab.isUpdatingAccount ||
                  (tab.editingAccountId ? !tab.access.canUpdate : !tab.access.canCreate)
                }
              >
                {tab.editingAccountId ? 'Update Account' : 'Create Account'}
              </Button>
              {tab.editingAccountId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => tab.setIsDeleteAccountDialogOpen(true)}
                  disabled={tab.isDeletingAccount}
                >
                  Delete Account
                </Button>
              ) : null}
              <Button variant="outline" onClick={tab.resetAccountForm}>
                Clear
              </Button>
            </div>

            {tab.editingAccountId ? (
              <p className="text-xs text-muted-foreground">
                Delete is only allowed when the account has no journal activity, no setup mappings,
                no petty cash fund, and no child accounts.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {tab.editingAccountId ? (
          <AccountingSetupHistoryCard
            entityType="accounting_account"
            entityId={tab.editingAccountId}
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
            data={tab.accounts}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search accounts"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      <AccountingSetupDeleteAccountDialog
        open={tab.isDeleteAccountDialogOpen}
        onOpenChange={tab.setIsDeleteAccountDialogOpen}
        removeLinkedCategoryOnDelete={tab.removeLinkedCategoryOnDelete}
        onRemoveLinkedCategoryOnDeleteChange={tab.setRemoveLinkedCategoryOnDelete}
        isDeletingAccount={tab.isDeletingAccount}
        canDeleteAccount={tab.access.canDelete}
        onDeleteAccount={() => void tab.handleDeleteAccount()}
      />
    </div>
  );
}
