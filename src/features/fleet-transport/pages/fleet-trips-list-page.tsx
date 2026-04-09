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
  useListFleetTripsQuery,
  useListFleetVehicleOptionsQuery,
  type FleetTrip,
} from '../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function tripStatusLabel(status: number) {
  if (status === 0) return 'Planned';
  if (status === 1) return 'In Progress';
  if (status === 2) return 'Completed';
  if (status === 3) return 'Cancelled';
  return 'Unknown';
}

function isStartAllowed(trip: FleetTrip) {
  return trip.status === 0;
}

function isCloseAllowed(trip: FleetTrip) {
  return trip.status === 1;
}

export function FleetTripsListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const [status, setStatus] = useState<string>('__all__');
  const [vehicleId, setVehicleId] = useState<string>('__all__');
  const [page, setPage] = useState(1);

  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery({ isActive: true });

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

  const { data, isLoading } = useListFleetTripsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Trips</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateFleetTrips}>
              <Button asChild>
                <Link to="/fleet-transport/trips/new">Create trip</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search trip no / vehicle / driver"
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
                  <SelectItem value="0">Planned</SelectItem>
                  <SelectItem value="1">In Progress</SelectItem>
                  <SelectItem value="2">Completed</SelectItem>
                  <SelectItem value="3">Cancelled</SelectItem>
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
                  <TableHead>Trip No</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Planned Start</TableHead>
                  <TableHead className="text-right">Processes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading trips...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.tripNo}</TableCell>
                      <TableCell>{row.vehiclePlateNumber ?? row.vehicleId}</TableCell>
                      <TableCell>{row.routePlanName ?? '-'}</TableCell>
                      <TableCell>{row.driverEmployeeName ?? row.driverEmployeeId}</TableCell>
                      <TableCell>{tripStatusLabel(row.status)}</TableCell>
                      <TableCell>
                        {row.plannedStartAt ? new Date(row.plannedStartAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/fleet-transport/trips/view/${row.id}`}>View</Link>
                          </Button>
                          <PermissionGuard permissionKey={PermissionKeys.CanAssignFleetCrew}>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/fleet-transport/trips/crew/${row.id}`}>Crew</Link>
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permissionKey={PermissionKeys.CanStartFleetTrips}>
                            {isStartAllowed(row) ? (
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/fleet-transport/trips/start/${row.id}`}>Start</Link>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                Start
                              </Button>
                            )}
                          </PermissionGuard>
                          <PermissionGuard permissionKey={PermissionKeys.CanCloseFleetTrips}>
                            {isCloseAllowed(row) ? (
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/fleet-transport/trips/close/${row.id}`}>Close</Link>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                Close
                              </Button>
                            )}
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No trips found.</TableCell>
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
