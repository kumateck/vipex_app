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
  type TaxProfileMutationInput,
  type TaxProfileRow,
  useCreateTaxProfileMutation,
  useDeleteTaxProfileMutation,
  useListTaxProfilesQuery,
  useUpdateTaxProfileMutation,
} from '../../../api';
import { StatusBadge } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import { createEmptyTaxProfileForm } from '../utils/accounting-setup-utils';

export function useAccountingSetupTaxProfilesTab({
  companyId,
  access,
  user: _user,
  onSelectProfile,
  onAfterDelete,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
  onSelectProfile?: (profileId: string) => void;
  onAfterDelete?: () => Promise<void>;
}) {
  const [taxProfileForm, setTaxProfileForm] = useState(() => createEmptyTaxProfileForm(companyId));
  const [editingTaxProfileId, setEditingTaxProfileId] = useState<string | null>(null);

  const {
    data: taxProfiles = [],
    isFetching,
    refetch,
  } = useListTaxProfilesQuery({ companyId }, { skip: !companyId || !access.canRead });

  const [createTaxProfile, { isLoading: isCreatingTaxProfile }] = useCreateTaxProfileMutation();
  const [updateTaxProfile, { isLoading: isUpdatingTaxProfile }] = useUpdateTaxProfileMutation();
  const [deleteTaxProfile, { isLoading: isDeletingTaxProfile }] = useDeleteTaxProfileMutation();

  function resetTaxProfileForm() {
    setEditingTaxProfileId(null);
    setTaxProfileForm(createEmptyTaxProfileForm(companyId));
  }

  function handleEditTaxProfile(profile: TaxProfileRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit tax profiles');
      return;
    }

    setEditingTaxProfileId(profile.id);
    onSelectProfile?.(profile.id);
    setTaxProfileForm({ companyId, name: profile.name, active: profile.active });
  }

  async function handleSaveTaxProfile() {
    if (editingTaxProfileId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingTaxProfileId
          ? 'You do not have permission to update tax profiles'
          : 'You do not have permission to create tax profiles',
      );
      return;
    }

    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: TaxProfileMutationInput = {
      companyId,
      name: taxProfileForm.name.trim(),
      active: taxProfileForm.active,
    };

    if (!payload.name) {
      toast.error('Tax profile name is required');
      return;
    }

    try {
      if (editingTaxProfileId) {
        await updateTaxProfile({ id: editingTaxProfileId, body: payload }).unwrap();
        toast.success('Tax profile updated');
      } else {
        await createTaxProfile(payload).unwrap();
        toast.success('Tax profile created');
      }
      resetTaxProfileForm();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tax profile');
    }
  }

  async function handleDeleteTaxProfile() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete tax profiles');
      return;
    }
    if (!companyId || !editingTaxProfileId) {
      toast.error('Select a tax profile first');
      return;
    }
    if (
      !globalThis.confirm(
        'Delete this tax profile? This only works when no components, journals, or payroll rows reference it.',
      )
    ) {
      return;
    }

    try {
      await deleteTaxProfile({ id: editingTaxProfileId, companyId }).unwrap();
      toast.success('Tax profile deleted');
      resetTaxProfileForm();
      await refetch();
      if (onAfterDelete) await onAfterDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tax profile');
    }
  }

  const columns = useMemo<ColumnDef<TaxProfileRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Profile Name' },
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
              <DropdownMenuItem onClick={() => handleEditTaxProfile(row.original)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [access.canUpdate],
  );

  return {
    access,
    columns,
    editingTaxProfileId,
    isCreatingTaxProfile,
    isDeletingTaxProfile,
    isFetching,
    isUpdatingTaxProfile,
    taxProfileForm,
    taxProfiles,
    resetTaxProfileForm,
    setTaxProfileForm,
    handleDeleteTaxProfile,
    handleSaveTaxProfile,
  };
}
