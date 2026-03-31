import { useMemo, useState } from 'react';
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
  useListFleetVehiclesQuery,
  useUpdateFleetVehicleMutation,
  type FleetVehicle,
} from '../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function FleetVehiclesListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<FleetVehicle | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { data, isLoading } = useListFleetVehiclesQuery(query);
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateFleetVehicleMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const openEditDialog = (vehicle: FleetVehicle) => {
    setEditing(vehicle);
    setPlateNumber(vehicle.plateNumber);
    setModel(vehicle.model);
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    if (!plateNumber.trim() || !model.trim()) {
      toast.error('Plate number and model are required');
      return;
    }

    try {
      await updateVehicle({
        id: editing.id,
        body: {
          plateNumber: plateNumber.trim(),
          model: model.trim(),
        },
      }).unwrap();
      toast.success('Vehicle updated');
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update vehicle');
    }
  };

  const onToggleActive = async (vehicle: FleetVehicle) => {
    try {
      await updateVehicle({
        id: vehicle.id,
        body: { isActive: !vehicle.isActive },
      }).unwrap();
      toast.success(vehicle.isActive ? 'Vehicle deactivated' : 'Vehicle activated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update vehicle status');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Vehicles</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateFleetVehicles}>
              <Button asChild>
                <Link to="/fleet-transport/vehicles/new">Create vehicle</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search plate/model"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading vehicles...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.plateNumber}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell>{row.assignedDriverName ?? '-'}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard permissionKey={PermissionKeys.CanUpdateFleetVehicles}>
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
                    <TableCell colSpan={5}>No vehicles found.</TableCell>
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
              <DialogTitle>Edit Vehicle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Plate number"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
              />
              <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
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
