import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useListFleetVehicleComplianceAlertsQuery,
  useListFleetVehiclesQuery,
  useUpdateFleetVehicleMutation,
  type FleetVehicle,
} from '../../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function ownershipTypeLabel(value: number) {
  if (value === 0) return 'Company Owned';
  if (value === 1) return 'Leased';
  if (value === 2) return 'Third Party';
  return 'Unknown';
}

function fuelTypeLabel(value: number) {
  if (value === 0) return 'Petrol';
  if (value === 1) return 'Diesel';
  if (value === 2) return 'Electric';
  if (value === 3) return 'Hybrid';
  if (value === 4) return 'Gas';
  if (value === 5) return 'Other';
  return 'Unknown';
}

function lifecycleStatusLabel(value: number) {
  if (value === 0) return 'Active';
  if (value === 1) return 'In Maintenance';
  if (value === 2) return 'Retired';
  if (value === 3) return 'Decommissioned';
  return 'Unknown';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetVehiclesListPage() {
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
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { data, isLoading } = useListFleetVehiclesQuery(query);
  const { data: complianceAlerts } = useListFleetVehicleComplianceAlertsQuery({
    horizonDays: 30,
    limit: 200,
  });
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateFleetVehicleMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onToggleActive = async (vehicle: FleetVehicle) => {
    try {
      await updateVehicle({
        id: vehicle.id,
        body: { isActive: !vehicle.isActive },
      }).unwrap();
      toast.success(vehicle.isActive ? 'Vehicle deactivated' : 'Vehicle activated');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update vehicle status');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Vehicles</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateFleetVehicle}>
              <Button asChild>
                <Link to="/fleet-transport/vehicles/new">Create vehicle</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Compliance Alerts (30 days)</p>
              <p className="text-muted-foreground">
                Total: {complianceAlerts?.summary.total ?? 0} | Expired:{' '}
                {complianceAlerts?.summary.expired ?? 0} | Due soon:{' '}
                {complianceAlerts?.summary.dueSoon ?? 0}
              </p>
            </div>

            <Input
              placeholder="Search plate/model"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Insurance Expiry</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading vehicles...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.plateNumber}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell>{ownershipTypeLabel(row.ownershipType)}</TableCell>
                      <TableCell>{fuelTypeLabel(row.fuelType)}</TableCell>
                      <TableCell>{lifecycleStatusLabel(row.lifecycleStatus)}</TableCell>
                      <TableCell>{formatDateTime(row.insuranceExpiryAt)}</TableCell>
                      <TableCell>{row.assignedDriverName ?? '-'}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard permissionKey={PermissionKeys.CanUpdateFleetVehicle}>
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/fleet-transport/vehicles/view/${row.id}`}>View</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/fleet-transport/vehicles/edit/${row.id}`}>Edit</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/fleet-transport/vehicles/view/${row.id}/documents`}>
                                Documents
                              </Link>
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
                    <TableCell colSpan={9}>No vehicles found.</TableCell>
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
      </div>
    </ScrollableWrapper>
  );
}
