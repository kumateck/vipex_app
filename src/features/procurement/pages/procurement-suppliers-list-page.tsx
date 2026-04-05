import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useListProcurementSuppliersQuery,
  useUpdateProcurementSupplierMutation,
  type ProcurementSupplier,
} from '../api/procurement.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function ProcurementSuppliersListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProcurementSupplier | null>(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { data, isLoading } = useListProcurementSuppliersQuery(query);
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateProcurementSupplierMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const openEditDialog = (supplier: ProcurementSupplier) => {
    setEditing(supplier);
    setName(supplier.name);
    setContactPerson(supplier.contactPerson ?? '');
    setEmail(supplier.email ?? '');
    setTelephone(supplier.telephone ?? '');
    setAddress(supplier.address ?? '');
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    if (!name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    try {
      await updateSupplier({
        id: editing.id,
        body: {
          name: name.trim(),
          contactPerson: contactPerson.trim() || null,
          email: email.trim() || null,
          telephone: telephone.trim() || null,
          address: address.trim() || null,
        },
      }).unwrap();
      toast.success('Supplier updated');
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    }
  };

  const onToggleActive = async (supplier: ProcurementSupplier) => {
    try {
      await updateSupplier({
        id: supplier.id,
        body: { isActive: !supplier.isActive },
      }).unwrap();
      toast.success(supplier.isActive ? 'Supplier deactivated' : 'Supplier activated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier status');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Suppliers</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementSuppliers}>
              <Button asChild>
                <Link to="/procurement/suppliers/new">Create supplier</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search suppliers"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading suppliers...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.contactPerson ?? '-'}</TableCell>
                      <TableCell>{row.email ?? '-'}</TableCell>
                      <TableCell>{row.telephone ?? '-'}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard
                          permissionKey={PermissionKeys.CanUpdateProcurementSuppliers}
                        >
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => onToggleActive(row)}
                            >
                              {row.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No suppliers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Supplier name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Contact person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                placeholder="Telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
              <Input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={onSaveEdit} disabled={isUpdating}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollableWrapper>
  );
}
