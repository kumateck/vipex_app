import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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
import { useAccountingSetupTaxComponentsTab } from '../hooks/use-accounting-setup-tax-components-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import { ALL_TAX_PROFILES } from '../utils/accounting-setup-utils';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupTaxComponentsTab({
  companyId,
  access,
  user,
  selectedTaxProfileId,
  setSelectedTaxProfileId,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
  selectedTaxProfileId: string;
  setSelectedTaxProfileId: (profileId: string) => void;
}) {
  const tab = useAccountingSetupTaxComponentsTab({
    companyId,
    access,
    user,
    selectedTaxProfileId,
    setSelectedTaxProfileId,
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.editingTaxComponentId ? 'Edit Tax Component' : 'New Tax Component'}
            </CardTitle>
            <CardDescription>
              Maintain the stored tax component rows for a profile. This keeps profile metadata
              maintainable without changing the current Ghana tax calculation code path.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Profile</Label>
              <Select
                value={tab.taxComponentForm.profileId || tab.effectiveTaxProfileId || undefined}
                onValueChange={(value) => {
                  tab.setSelectedTaxProfileId(value);
                  tab.setTaxComponentForm((current) => ({ ...current, profileId: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax profile" />
                </SelectTrigger>
                <SelectContent>
                  {tab.taxProfiles.map((profile) => (
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
                  value={tab.taxComponentForm.key}
                  onChange={(event) =>
                    tab.setTaxComponentForm((current) => ({ ...current, key: event.target.value }))
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
                    value={String(tab.taxComponentForm.numerator)}
                    onChange={(event) =>
                      tab.setTaxComponentForm((current) => ({
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
                    value={String(tab.taxComponentForm.denominator)}
                    onChange={(event) =>
                      tab.setTaxComponentForm((current) => ({
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
                  value={String(tab.taxComponentForm.sortOrder ?? 0)}
                  onChange={(event) =>
                    tab.setTaxComponentForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select
                  value={String(tab.taxComponentForm.inclusive)}
                  onValueChange={(value) =>
                    tab.setTaxComponentForm((current) => ({
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
                  date={tab.parseDateInputValue(tab.taxComponentForm.startsAt)}
                  onDateChange={(value) =>
                    tab.setTaxComponentForm((current) => ({
                      ...current,
                      startsAt: tab.toDateInputValue(value),
                    }))
                  }
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-component-ends-at">Ends At</Label>
                <DatePicker
                  date={tab.parseDateInputValue(tab.taxComponentForm.endsAt)}
                  onDateChange={(value) =>
                    tab.setTaxComponentForm((current) => ({
                      ...current,
                      endsAt: value ? tab.toDateInputValue(value) : null,
                    }))
                  }
                  placeholder="Select end date"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={String(tab.taxComponentForm.active)}
                  onValueChange={(value) =>
                    tab.setTaxComponentForm((current) => ({ ...current, active: value === 'true' }))
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
                onClick={() => void tab.handleSaveTaxComponent()}
                disabled={
                  tab.isCreatingTaxComponent ||
                  tab.isUpdatingTaxComponent ||
                  (tab.editingTaxComponentId ? !tab.access.canUpdate : !tab.access.canCreate) ||
                  !(tab.taxComponentForm.profileId || tab.effectiveTaxProfileId)
                }
              >
                {tab.editingTaxComponentId ? 'Update Tax Component' : 'Create Tax Component'}
              </Button>
              {tab.editingTaxComponentId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => void tab.handleDeleteTaxComponent()}
                  disabled={tab.isDeletingTaxComponent}
                >
                  Delete Tax Component
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => tab.resetTaxComponentForm()}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {tab.editingTaxComponentId ? (
          <AccountingSetupHistoryCard
            entityType="tax_component"
            entityId={tab.editingTaxComponentId}
            entityLabel="Tax Component"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Components</CardTitle>
          <CardDescription>
            Stored component rows for all profiles or the selected profile. These records support
            profile maintenance and payroll references while the current Ghana tax engine stays
            intact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Viewing Profile</Label>
            <Select value={tab.viewingTaxProfileId} onValueChange={tab.setViewingTaxProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tax profile to view components" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TAX_PROFILES}>All profiles</SelectItem>
                {tab.taxProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            mode="client"
            data={tab.taxComponents}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search tax components"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
