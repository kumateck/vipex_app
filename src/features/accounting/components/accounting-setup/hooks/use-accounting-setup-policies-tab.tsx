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
import type { AuthUser } from '@/stores/auth-store';
import {
  type ApprovalPolicyRow,
  useCreateApprovalPolicyMutation,
  useDeleteApprovalPolicyMutation,
  useListApprovalPoliciesQuery,
  useUpdateApprovalPolicyMutation,
} from '../../../api';
import { StatusBadge, formatMoney, fundingSourceLabel } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import {
  APPROVAL_POLICY_CODE_OPTIONS,
  ALL_FUNDING_SOURCES,
  createEmptyApprovalPolicyForm,
  normalizePolicyInputToCode,
  toApprovalPolicyPayload,
  toPolicyCodeLabel,
} from '../utils/accounting-setup-utils';

export function useAccountingSetupPoliciesTab({
  companyId,
  access,
  user: _user,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
}) {
  const [approvalPolicyForm, setApprovalPolicyForm] = useState(() =>
    createEmptyApprovalPolicyForm(companyId),
  );
  const [editingApprovalPolicyId, setEditingApprovalPolicyId] = useState<string | null>(null);
  const [policyCodeOptions, setPolicyCodeOptions] = useState(APPROVAL_POLICY_CODE_OPTIONS);

  const {
    data: approvalPolicies = [],
    isFetching,
    refetch,
  } = useListApprovalPoliciesQuery({ companyId }, { skip: !companyId || !access.canRead });

  const [createApprovalPolicy, { isLoading: isCreatingApprovalPolicy }] =
    useCreateApprovalPolicyMutation();
  const [updateApprovalPolicy, { isLoading: isUpdatingApprovalPolicy }] =
    useUpdateApprovalPolicyMutation();
  const [deleteApprovalPolicy, { isLoading: isDeletingApprovalPolicy }] =
    useDeleteApprovalPolicyMutation();

  function resetApprovalPolicyForm() {
    setEditingApprovalPolicyId(null);
    setApprovalPolicyForm(createEmptyApprovalPolicyForm(companyId));
  }

  function handleEditApprovalPolicy(policy: ApprovalPolicyRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit approval policies');
      return;
    }

    setEditingApprovalPolicyId(policy.id);
    setApprovalPolicyForm({
      companyId,
      policyCode: policy.policyCode,
      name: policy.name,
      amountLimitCedis: ((policy.amountLimitPsw ?? 0) / 100).toFixed(2),
      autoAuthorizeBelowThreshold: policy.autoAuthorizeBelowThreshold,
      requiresHeadOfficeApproval: policy.requiresHeadOfficeApproval,
      appliesToFundingSource:
        policy.appliesToFundingSource == null
          ? ALL_FUNDING_SOURCES
          : String(policy.appliesToFundingSource),
      active: policy.active,
    });
  }

  async function handleSaveApprovalPolicy() {
    if (editingApprovalPolicyId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingApprovalPolicyId
          ? 'You do not have permission to update approval policies'
          : 'You do not have permission to create approval policies',
      );
      return;
    }

    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload = toApprovalPolicyPayload({ ...approvalPolicyForm, companyId });
    if (!payload) {
      toast.error('Enter a valid amount limit');
      return;
    }

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
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save approval policy');
    }
  }

  async function handleDeleteApprovalPolicy() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete approval policies');
      return;
    }

    if (!companyId || !editingApprovalPolicyId) {
      toast.error('Select an approval policy first');
      return;
    }

    if (!globalThis.confirm('Delete this approval policy?')) return;

    try {
      await deleteApprovalPolicy({ id: editingApprovalPolicyId, companyId }).unwrap();
      toast.success('Approval policy deleted');
      resetApprovalPolicyForm();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete approval policy');
    }
  }

  const columns = useMemo<ColumnDef<ApprovalPolicyRow>[]>(
    () => [
      { accessorKey: 'policyCode', header: 'Code' },
      { accessorKey: 'name', header: 'Policy' },
      { id: 'amountLimit', header: 'Limit', accessorFn: (row) => formatMoney(row.amountLimitPsw) },
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
        id: 'autoAuthorize',
        header: 'Auto Authorize',
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.autoAuthorizeBelowThreshold ? 'Enabled' : 'Disabled'}
            tone={row.original.autoAuthorizeBelowThreshold ? 'secondary' : 'outline'}
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
              <DropdownMenuItem onClick={() => handleEditApprovalPolicy(row.original)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [access.canUpdate],
  );

  async function createPolicyCodeOption(input: string) {
    const normalizedValue = normalizePolicyInputToCode(input);
    const existing = policyCodeOptions.find((option) => option.value === normalizedValue);
    if (existing) return existing;

    const created = {
      value: normalizedValue,
      label: toPolicyCodeLabel(normalizedValue),
      defaultName: toPolicyCodeLabel(normalizedValue),
      description: 'Custom policy code created from setup form.',
      defaultFundingScope: ALL_FUNDING_SOURCES,
    };
    setPolicyCodeOptions((current) => [created, ...current]);
    return created;
  }

  return {
    access,
    approvalPolicies,
    approvalPolicyForm,
    columns,
    editingApprovalPolicyId,
    isCreatingApprovalPolicy,
    isDeletingApprovalPolicy,
    isFetching,
    isUpdatingApprovalPolicy,
    policyCodeOptions,
    resetApprovalPolicyForm,
    setApprovalPolicyForm,
    handleDeleteApprovalPolicy,
    handleSaveApprovalPolicy,
    createPolicyCodeOption,
  };
}
