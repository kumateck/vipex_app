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
  type TaxComponentMutationInput,
  type TaxComponentRow,
  useCreateTaxComponentMutation,
  useDeleteTaxComponentMutation,
  useListTaxComponentsQuery,
  useListTaxProfilesQuery,
  useUpdateTaxComponentMutation,
} from '../../../api';
import { StatusBadge } from '../../accounting-shared';
import type { SetupAccess } from '../types/accounting-setup.types';
import {
  ALL_TAX_PROFILES,
  createEmptyTaxComponentForm,
  parseDateInputValue,
  toDateInputValue,
  todayDateValue,
} from '../utils/accounting-setup-utils';

export function useAccountingSetupTaxComponentsTab({
  companyId,
  access,
  user: _user,
  selectedTaxProfileId,
  setSelectedTaxProfileId,
}: {
  companyId: string;
  access: SetupAccess;
  user: AuthUser;
  selectedTaxProfileId: string;
  setSelectedTaxProfileId: (profileId: string) => void;
}) {
  const [viewingTaxProfileId, setViewingTaxProfileId] = useState(ALL_TAX_PROFILES);
  const [taxComponentForm, setTaxComponentForm] = useState(() =>
    createEmptyTaxComponentForm(companyId),
  );
  const [editingTaxComponentId, setEditingTaxComponentId] = useState<string | null>(null);

  const { data: taxProfiles = [] } = useListTaxProfilesQuery(
    { companyId },
    { skip: !companyId || !access.canRead },
  );

  const effectiveTaxProfileId = selectedTaxProfileId || taxProfiles[0]?.id || '';

  const {
    data: taxComponents = [],
    isFetching,
    refetch,
  } = useListTaxComponentsQuery(
    {
      companyId,
      profileId: viewingTaxProfileId === ALL_TAX_PROFILES ? undefined : viewingTaxProfileId,
    },
    { skip: !companyId || !access.canRead },
  );

  const [createTaxComponent, { isLoading: isCreatingTaxComponent }] =
    useCreateTaxComponentMutation();
  const [updateTaxComponent, { isLoading: isUpdatingTaxComponent }] =
    useUpdateTaxComponentMutation();
  const [deleteTaxComponent, { isLoading: isDeletingTaxComponent }] =
    useDeleteTaxComponentMutation();

  const taxProfileNameById = useMemo(
    () => new Map(taxProfiles.map((profile) => [profile.id, profile.name])),
    [taxProfiles],
  );

  function resetTaxComponentForm(profileId = effectiveTaxProfileId) {
    setEditingTaxComponentId(null);
    setTaxComponentForm(createEmptyTaxComponentForm(companyId, profileId));
  }

  function handleEditTaxComponent(component: TaxComponentRow) {
    if (!access.canUpdate) {
      toast.error('You do not have permission to edit tax components');
      return;
    }

    setSelectedTaxProfileId(component.profileId);
    setEditingTaxComponentId(component.id);
    setTaxComponentForm({
      companyId,
      profileId: component.profileId,
      key: component.key,
      numerator: component.numerator,
      denominator: component.denominator,
      inclusive: component.inclusive,
      sortOrder: component.sortOrder,
      startsAt: component.startsAt.slice(0, 10),
      endsAt: component.endsAt ? component.endsAt.slice(0, 10) : null,
      active: component.active,
    });
  }

  async function handleSaveTaxComponent() {
    if (editingTaxComponentId ? !access.canUpdate : !access.canCreate) {
      toast.error(
        editingTaxComponentId
          ? 'You do not have permission to update tax components'
          : 'You do not have permission to create tax components',
      );
      return;
    }

    if (!companyId) {
      toast.error('Authenticated company is required');
      return;
    }

    const payload: TaxComponentMutationInput = {
      ...taxComponentForm,
      companyId,
      profileId: taxComponentForm.profileId || effectiveTaxProfileId,
      key: taxComponentForm.key.trim(),
      startsAt: taxComponentForm.startsAt || todayDateValue(),
      endsAt: taxComponentForm.endsAt || null,
    };

    if (!payload.profileId || !payload.key) {
      toast.error('Tax profile and component key are required');
      return;
    }

    try {
      if (editingTaxComponentId) {
        await updateTaxComponent({ id: editingTaxComponentId, body: payload }).unwrap();
        toast.success('Tax component updated');
      } else {
        await createTaxComponent(payload).unwrap();
        toast.success('Tax component created');
      }
      resetTaxComponentForm(payload.profileId);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tax component');
    }
  }

  async function handleDeleteTaxComponent() {
    if (!access.canDelete) {
      toast.error('You do not have permission to delete tax components');
      return;
    }

    if (!companyId || !editingTaxComponentId) {
      toast.error('Select a tax component first');
      return;
    }

    if (!globalThis.confirm('Delete this tax component?')) return;

    try {
      await deleteTaxComponent({ id: editingTaxComponentId, companyId }).unwrap();
      toast.success('Tax component deleted');
      resetTaxComponentForm();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tax component');
    }
  }

  const columns = useMemo<ColumnDef<TaxComponentRow>[]>(
    () => [
      {
        id: 'profile',
        header: 'Profile',
        accessorFn: (row) => taxProfileNameById.get(row.profileId) ?? row.profileId,
      },
      { accessorKey: 'key', header: 'Key' },
      {
        id: 'fraction',
        header: 'Fraction',
        accessorFn: (row) => `${row.numerator}/${row.denominator}`,
      },
      {
        id: 'inclusive',
        header: 'Inclusive',
        cell: ({ row }) => (
          <StatusBadge label={row.original.inclusive ? 'Inclusive' : 'Exclusive'} tone="outline" />
        ),
      },
      { accessorKey: 'sortOrder', header: 'Order' },
      {
        id: 'period',
        header: 'Effective Period',
        accessorFn: (row) =>
          `${row.startsAt.slice(0, 10)}${row.endsAt ? ` to ${row.endsAt.slice(0, 10)}` : ''}`,
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
              <DropdownMenuItem onClick={() => handleEditTaxComponent(row.original)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [access.canUpdate, taxProfileNameById],
  );

  return {
    access,
    columns,
    editingTaxComponentId,
    effectiveTaxProfileId,
    isCreatingTaxComponent,
    isDeletingTaxComponent,
    isFetching,
    isUpdatingTaxComponent,
    parseDateInputValue,
    selectedTaxProfileId,
    setSelectedTaxProfileId,
    setTaxComponentForm,
    setViewingTaxProfileId,
    taxComponentForm,
    taxComponents,
    taxProfiles,
    toDateInputValue,
    viewingTaxProfileId,
    resetTaxComponentForm,
    handleDeleteTaxComponent,
    handleSaveTaxComponent,
  };
}
