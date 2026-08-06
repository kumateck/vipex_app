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
import { useAccountingSetupTaxProfilesTab } from '../hooks/use-accounting-setup-tax-profiles-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupTaxProfilesTab({
  companyId,
  access,
  user,
  onSelectProfile,
  onAfterDelete,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
  onSelectProfile?: (profileId: string) => void;
  onAfterDelete?: () => Promise<void>;
}) {
  const tab = useAccountingSetupTaxProfilesTab({
    companyId,
    access,
    user,
    onSelectProfile,
    onAfterDelete,
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.editingTaxProfileId ? 'Edit Tax Profile' : 'New Tax Profile'}
            </CardTitle>
            <CardDescription>
              Maintain the tax profiles that the Ghana tax engine can reference for posting and
              filing review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="tax-profile-name">Name</Label>
                <Input
                  id="tax-profile-name"
                  value={tab.taxProfileForm.name}
                  onChange={(event) =>
                    tab.setTaxProfileForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ghana VAT Standard"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={String(tab.taxProfileForm.active)}
                  onValueChange={(value) =>
                    tab.setTaxProfileForm((current) => ({ ...current, active: value === 'true' }))
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
                onClick={() => void tab.handleSaveTaxProfile()}
                disabled={
                  tab.isCreatingTaxProfile ||
                  tab.isUpdatingTaxProfile ||
                  (tab.editingTaxProfileId ? !tab.access.canUpdate : !tab.access.canCreate)
                }
              >
                {tab.editingTaxProfileId ? 'Update Tax Profile' : 'Create Tax Profile'}
              </Button>
              {tab.editingTaxProfileId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => void tab.handleDeleteTaxProfile()}
                  disabled={tab.isDeletingTaxProfile}
                >
                  Delete Tax Profile
                </Button>
              ) : null}
              <Button variant="outline" onClick={tab.resetTaxProfileForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {tab.editingTaxProfileId ? (
          <AccountingSetupHistoryCard
            entityType="tax_profile"
            entityId={tab.editingTaxProfileId}
            entityLabel="Tax Profile"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Profiles</CardTitle>
          <CardDescription>
            Profile names can be maintained here while the tax calculation engine remains unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="client"
            data={tab.taxProfiles}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search tax profiles"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
