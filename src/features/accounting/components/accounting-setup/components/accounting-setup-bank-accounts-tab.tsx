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
import { useAccountingSetupBankAccountsTab } from '../hooks/use-accounting-setup-bank-accounts-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupBankAccountsTab({
  companyId,
  access,
  user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const tab = useAccountingSetupBankAccountsTab({ companyId, access, user });

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.editingBankAccountId ? 'Edit Company Bank Account' : 'New Company Bank Account'}
            </CardTitle>
            <CardDescription>
              Register the head-office bank accounts that accounting and expense payments can post
              against.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="bank-account-name">Display Name</Label>
                <Input
                  id="bank-account-name"
                  value={tab.bankAccountForm.name}
                  onChange={(event) =>
                    tab.setBankAccountForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Main Operations Account"
                />
              </div>

              <div className="space-y-2">
                <Label>Mapped Ledger Account</Label>
                <Select
                  value={tab.bankAccountForm.accountId || undefined}
                  onValueChange={(value) =>
                    tab.setBankAccountForm((current) => ({ ...current, accountId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset account" />
                  </SelectTrigger>
                  <SelectContent>
                    {tab.postableAssetAccounts.map((account) => (
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
                  value={tab.bankAccountForm.bankName ?? ''}
                  onChange={(event) =>
                    tab.setBankAccountForm((current) => ({
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
                  value={tab.bankAccountForm.branchName ?? ''}
                  onChange={(event) =>
                    tab.setBankAccountForm((current) => ({
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
                  value={tab.bankAccountForm.accountNumberMasked ?? ''}
                  onChange={(event) =>
                    tab.setBankAccountForm((current) => ({
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
                  value={String(tab.bankAccountForm.active)}
                  onValueChange={(value) =>
                    tab.setBankAccountForm((current) => ({ ...current, active: value === 'true' }))
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
                onClick={() => void tab.handleSaveBankAccount()}
                disabled={
                  tab.isCreatingCompanyBankAccount ||
                  tab.isUpdatingCompanyBankAccount ||
                  (tab.editingBankAccountId ? !tab.access.canUpdate : !tab.access.canCreate)
                }
              >
                {tab.editingBankAccountId ? 'Update Bank Account' : 'Create Bank Account'}
              </Button>
              {tab.editingBankAccountId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => void tab.handleDeleteBankAccount()}
                  disabled={tab.isDeletingCompanyBankAccount}
                >
                  Delete Bank Account
                </Button>
              ) : null}
              <Button variant="outline" onClick={tab.resetBankAccountForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {tab.editingBankAccountId ? (
          <AccountingSetupHistoryCard
            entityType="company_bank_account"
            entityId={tab.editingBankAccountId}
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
            data={tab.companyBankAccounts}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search bank accounts"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
