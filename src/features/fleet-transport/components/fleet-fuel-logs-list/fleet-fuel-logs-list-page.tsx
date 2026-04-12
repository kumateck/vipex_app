import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useListFleetFuelLogsQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function statusLabel(status: number) {
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  return 'Draft';
}

export function FleetFuelLogsListPage() {
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

  const [status, setStatus] = useState<string>('__all__');
  const [vehicleId, setVehicleId] = useState<string>('__all__');
  const [page, setPage] = useState(1);

  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery();

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        status: status === '__all__' ? undefined : Number(status),
        vehicleId: vehicleId === '__all__' ? undefined : vehicleId,
      },
    }),
    [page, search, status, vehicleId],
  );

  const { data, isLoading } = useListFleetFuelLogsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Fuel Logs</CardTitle>
            <div className="flex gap-2">
              <PermissionGuard permissionKey={PermissionKeys.CanApproveFleetFuelLogs}>
                <Button asChild variant="outline">
                  <Link to="/fleet-transport/fuel-logs/approvals">Approvals</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanReadFleetTransport}>
                <Button asChild variant="outline">
                  <Link to="/fleet-transport/fuel-analytics">Analytics</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanCreateFleetFuelLogs}>
                <Button asChild>
                  <Link to="/fleet-transport/fuel-logs/new">Create fuel log</Link>
                </Button>
              </PermissionGuard>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search log no/vehicle/station"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All status</SelectItem>
                  <SelectItem value="1">Submitted</SelectItem>
                  <SelectItem value="2">Approved</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={vehicleId}
                onValueChange={(value) => {
                  setVehicleId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log No</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Logged By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading fuel logs...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.logNo}</TableCell>
                      <TableCell>{row.vehiclePlateNumber ?? '-'}</TableCell>
                      <TableCell>{row.liters.toLocaleString()}</TableCell>
                      <TableCell>{row.fuelCostPsw.toLocaleString()}</TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                      <TableCell>{row.loggedByName ?? '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No fuel logs found.</TableCell>
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
