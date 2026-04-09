import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
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
import { useAccountingSetupPoliciesTab } from '../hooks/use-accounting-setup-policies-tab';
import type { SetupAccess } from '../types/accounting-setup.types';
import {
  FUNDING_SOURCE_OPTIONS,
  ALL_FUNDING_SOURCES,
  getPolicyTemplate,
  isManualJournalPolicyCode,
} from '../utils/accounting-setup-utils';
import { AccountingSetupHistoryCard } from './accounting-setup-history-card';

export function AccountingSetupPoliciesTab({
  companyId,
  access,
  user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const tab = useAccountingSetupPoliciesTab({ companyId, access, user });

  const selectedPolicyTemplate = getPolicyTemplate(tab.approvalPolicyForm.policyCode);
  const isManualJournalPolicy = isManualJournalPolicyCode(tab.approvalPolicyForm.policyCode);

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.editingApprovalPolicyId ? 'Edit Approval Policy' : 'New Approval Policy'}
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
                <CreatableCombobox
                  value={tab.approvalPolicyForm.policyCode}
                  onChange={(value, selectedOption) =>
                    tab.setApprovalPolicyForm((current) => ({
                      ...current,
                      policyCode: value.trim().toUpperCase(),
                      name:
                        selectedOption &&
                        (!current.name.trim() || current.name === current.policyCode)
                          ? selectedOption.defaultName
                          : current.name,
                      appliesToFundingSource: selectedOption
                        ? selectedOption.defaultFundingScope
                        : isManualJournalPolicyCode(value)
                          ? ALL_FUNDING_SOURCES
                          : current.appliesToFundingSource,
                      autoAuthorizeBelowThreshold: isManualJournalPolicyCode(value)
                        ? current.autoAuthorizeBelowThreshold
                        : true,
                    }))
                  }
                  getLabel={(item) => item.label}
                  getValue={(item) => item.value}
                  options={tab.policyCodeOptions}
                  allowCreate
                  onCreate={tab.createPolicyCodeOption}
                  placeholder="Select policy code"
                  searchPlaceholder="Search policy code..."
                />
                <p className="text-xs text-muted-foreground">
                  {selectedPolicyTemplate?.description ??
                    'Select a standard policy code to auto-apply intended defaults.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy-name">Name</Label>
                <Input
                  id="policy-name"
                  value={tab.approvalPolicyForm.name}
                  onChange={(event) =>
                    tab.setApprovalPolicyForm((current) => ({
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
                  value={tab.approvalPolicyForm.amountLimitCedis}
                  onChange={(event) =>
                    tab.setApprovalPolicyForm((current) => ({
                      ...current,
                      amountLimitCedis: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              {!isManualJournalPolicy ? (
                <div className="space-y-2">
                  <Label>Funding Scope</Label>
                  <Select
                    value={tab.approvalPolicyForm.appliesToFundingSource}
                    onValueChange={(value) =>
                      tab.setApprovalPolicyForm((current) => ({
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
              ) : null}

              {isManualJournalPolicy ? (
                <div className="space-y-2">
                  <Label>Auto Authorize (Below Threshold)</Label>
                  <Select
                    value={String(tab.approvalPolicyForm.autoAuthorizeBelowThreshold)}
                    onValueChange={(value) =>
                      tab.setApprovalPolicyForm((current) => ({
                        ...current,
                        autoAuthorizeBelowThreshold: value === 'true',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled (queue all for approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Approval Level</Label>
                <Select
                  value={String(tab.approvalPolicyForm.requiresHeadOfficeApproval)}
                  onValueChange={(value) =>
                    tab.setApprovalPolicyForm((current) => ({
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
                  value={String(tab.approvalPolicyForm.active)}
                  onValueChange={(value) =>
                    tab.setApprovalPolicyForm((current) => ({
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
                onClick={() => void tab.handleSaveApprovalPolicy()}
                disabled={
                  tab.isCreatingApprovalPolicy ||
                  tab.isUpdatingApprovalPolicy ||
                  (tab.editingApprovalPolicyId ? !tab.access.canUpdate : !tab.access.canCreate)
                }
              >
                {tab.editingApprovalPolicyId ? 'Update Policy' : 'Create Policy'}
              </Button>
              {tab.editingApprovalPolicyId && tab.access.canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => void tab.handleDeleteApprovalPolicy()}
                  disabled={tab.isDeletingApprovalPolicy}
                >
                  Delete Policy
                </Button>
              ) : null}
              <Button variant="outline" onClick={tab.resetApprovalPolicyForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {tab.editingApprovalPolicyId ? (
          <AccountingSetupHistoryCard
            entityType="accounting_approval_policy"
            entityId={tab.editingApprovalPolicyId}
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
            data={tab.approvalPolicies}
            columns={tab.columns}
            loading={tab.isFetching}
            showSearch
            searchPlaceholder="Search approval policies"
            pageSizeOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
