import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type Warehouse,
  type WarehouseMutationInput,
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useListWarehousesQuery,
  useUpdateWarehouseMutation,
} from '../../api/warehouses.api';
import { WarehousesDeleteDialog } from './warehouses-delete-dialog';
import { WarehouseFormCard } from './warehouse-form-card';

function emptyForm(branchId: string): WarehouseMutationInput {
  return {
    branchId,
    name: '',
    description: '',
    active: true,
  };
}

export function WarehousesPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? '';
  const defaultBranchId = user?.branch?.id ?? '';
  const canRead = user?.permissions?.includes(PermissionKeys.CanReadWarehouses);
  const canCreate = user?.permissions?.includes(PermissionKeys.CanCreateWarehouses);
  const canUpdate = user?.permissions?.includes(PermissionKeys.CanUpdateWarehouses);
  const canDelete = user?.permissions?.includes(PermissionKeys.CanDeleteWarehouses);

  const [form, setForm] = useState(() => emptyForm(defaultBranchId));
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data, isLoading, refetch } = useListWarehousesQuery(
    {
      page: 1,
      pageSize: 20,
      filters: { companyId },
    },
    { skip: !companyId || !canRead },
  );
  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation();

  function resetForm() {
    setEditing(null);
    setForm(emptyForm(defaultBranchId));
  }

  function handleEdit(row: Warehouse) {
    if (!canUpdate) {
      toast.error('You do not have permission to edit warehouses');
      return;
    }
    setEditing(row);
    setForm({
      branchId: row.branchId,
      name: row.name,
      description: row.description ?? '',
      active: row.active,
    });
  }

  async function handleSave() {
    if (editing ? !canUpdate : !canCreate) {
      toast.error(
        editing
          ? 'You do not have permission to update warehouses'
          : 'You do not have permission to create warehouses',
      );
      return;
    }
    if (!form.branchId || !form.name.trim()) {
      toast.error('Branch and warehouse name are required');
      return;
    }

    try {
      if (editing) {
        await updateWarehouse({ id: editing.id, body: form }).unwrap();
        toast.success('Warehouse updated');
      } else {
        await createWarehouse(form).unwrap();
        toast.success('Warehouse created');
      }
      resetForm();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save warehouse');
    }
  }

  async function handleDelete() {
    if (!canDelete) {
      toast.error('You do not have permission to delete warehouses');
      return;
    }
    if (!deleteTarget) return;
    try {
      await deleteWarehouse(deleteTarget.id).unwrap();
      toast.success('Warehouse deleted');
      setDeleteTarget(null);
      if (editing?.id === deleteTarget.id) resetForm();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete warehouse');
    }
  }

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const columns = useMemo<ColumnDef<Warehouse>[]>(
    () => [
      { accessorKey: 'name', header: 'Warehouse' },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) =>
          row.branch?.name ?? branchNameById.get(row.branchId) ?? 'Unknown branch',
      },
      {
        id: 'description',
        header: 'Description',
        accessorFn: (row) => row.description || '-',
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => (row.active ? 'Active' : 'Inactive'),
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdate ? (
                <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit</DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [branchNameById, canDelete, canUpdate],
  );

  if (!canRead) {
    return (
      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Management Restricted</CardTitle>
            <CardDescription>
              Your role does not include permission to view warehouses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Warehouse Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage branch-owned warehouses that can hold parcels before they are returned to the main
          office or sent to a location.
        </p>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <WarehouseFormCard
              branchOptions={branchOptions}
              canCreate={canCreate}
              canUpdate={canUpdate}
              editing={editing}
              form={form}
              isCreating={isCreating}
              isUpdating={isUpdating}
              onActiveChange={(active) => setForm((current) => ({ ...current, active }))}
              onBranchChange={(branchId) => setForm((current) => ({ ...current, branchId }))}
              onClear={resetForm}
              onDescriptionChange={(description) =>
                setForm((current) => ({ ...current, description }))
              }
              onNameChange={(name) => setForm((current) => ({ ...current, name }))}
              onSave={() => void handleSave()}
            />

            <Card>
              <CardHeader>
                <CardTitle>Warehouses</CardTitle>
                <CardDescription>
                  These warehouses can be used as parcel holding points inside a branch.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  mode="client"
                  data={data?.data ?? []}
                  columns={columns}
                  loading={isLoading}
                  showSearch
                  searchPlaceholder="Search warehouses"
                  pageSizeOptions={[10, 20, 50]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollableWrapper>

      <WarehousesDeleteDialog
        open={Boolean(deleteTarget)}
        isDeleting={isDeleting}
        canDelete={Boolean(canDelete)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
