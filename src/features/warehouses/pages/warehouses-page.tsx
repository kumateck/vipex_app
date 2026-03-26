import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '../api/warehouses.api';

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
  const canManage =
    user?.permissions?.includes(PermissionKeys.CanCreateWarehouses) ||
    user?.permissions?.includes(PermissionKeys.CanUpdateWarehouses);

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
      pageSize: 100,
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
    setEditing(row);
    setForm({
      branchId: row.branchId,
      name: row.name,
      description: row.description ?? '',
      active: row.active,
    });
  }

  async function handleSave() {
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
      toast.error(error instanceof Error ? error.message : 'Failed to save warehouse');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteWarehouse(deleteTarget.id).unwrap();
      toast.success('Warehouse deleted');
      setDeleteTarget(null);
      if (editing?.id === deleteTarget.id) resetForm();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete warehouse');
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
        accessorFn: (row) => row.branch?.name ?? branchNameById.get(row.branchId) ?? row.branchId,
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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(row.original)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(row.original)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [branchNameById],
  );

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Management Restricted</CardTitle>
          <CardDescription>
            Your role does not include permission to view warehouses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle>{editing ? 'Edit Warehouse' : 'New Warehouse'}</CardTitle>
                <CardDescription>
                  Warehouses are owned by a branch and can be used as parcel holding points.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={form.branchId || undefined}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, branchId: value }))
                    }
                    disabled={!canManage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse-name">Name</Label>
                  <Input
                    id="warehouse-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Main Receiving Store"
                    disabled={!canManage}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse-description">Description</Label>
                  <Input
                    id="warehouse-description"
                    value={form.description ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Optional note"
                    disabled={!canManage}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={String(form.active ?? true)}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, active: value === 'true' }))
                    }
                    disabled={!canManage}
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
                {canManage ? (
                  <div className="flex gap-2">
                    <Button onClick={() => void handleSave()} disabled={isCreating || isUpdating}>
                      {editing ? 'Update Warehouse' : 'Create Warehouse'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Clear
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This will only work when no parcel is currently held in the warehouse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={() => void handleDelete()}>
              {isDeleting ? 'Deleting...' : 'Delete Warehouse'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
