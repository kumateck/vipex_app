import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useListBranchOptionsQuery } from '@/features/branches';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useGetFleetDispatchBoardQuery,
  useListFleetDriverOptionsQuery,
  useListFleetTripsQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

function tripStatusLabel(value: number) {
  if (value === 0) return 'Planned';
  if (value === 1) return 'In Progress';
  if (value === 2) return 'Completed';
  if (value === 3) return 'Cancelled';
  return 'Unknown';
}

export function FleetDispatchBoardPage() {
  const [branchId, setBranchId] = useState('__all__');

  const { data: board, isLoading: loadingBoard } = useGetFleetDispatchBoardQuery();
  const { data: branches = [] } = useListBranchOptionsQuery();
  const { data: plannedTrips, isLoading: loadingPlanned } = useListFleetTripsQuery({
    pageSize: 200,
    filters: { status: 0 },
  });
  const { data: activeTrips, isLoading: loadingActive } = useListFleetTripsQuery({
    pageSize: 200,
    filters: { status: 1 },
  });
  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();

  const selectedBranchId = branchId === '__all__' ? null : branchId;

  const filteredPlanned = useMemo(() => {
    const rows = plannedTrips?.data ?? [];
    if (!selectedBranchId) return rows;
    return rows.filter((trip) => trip.branchId === selectedBranchId);
  }, [plannedTrips?.data, selectedBranchId]);

  const filteredActive = useMemo(() => {
    const rows = activeTrips?.data ?? [];
    if (!selectedBranchId) return rows;
    return rows.filter((trip) => trip.branchId === selectedBranchId);
  }, [activeTrips?.data, selectedBranchId]);

  const availableVehicles = useMemo(() => {
    const activeVehicleIds = new Set(filteredActive.map((trip) => trip.vehicleId));
    return vehicles.filter((vehicle) => !activeVehicleIds.has(vehicle.id));
  }, [vehicles, filteredActive]);

  const availableDrivers = useMemo(() => {
    const activeDriverIds = new Set(filteredActive.map((trip) => trip.driverEmployeeId));
    return drivers.filter((driver) => !activeDriverIds.has(driver.id));
  }, [drivers, filteredActive]);

  const routeWarnings = useMemo(
    () => filteredPlanned.filter((trip) => !trip.routePlanId),
    [filteredPlanned],
  );

  const scheduleWarnings = useMemo(
    () => filteredPlanned.filter((trip) => !trip.plannedStartAt || !trip.plannedEndAt),
    [filteredPlanned],
  );

  const isLoading = loadingBoard || loadingPlanned || loadingActive;

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Dispatch Board</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/route-assignments">Route Assignment</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/load-matching">Load Matching</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/load-matching/audit">Load Audit</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/check-in">Check-In</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/check-out">Check-Out</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/live-status">Live Status</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/ops-performance">Ops Performance</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded border p-3 text-sm">
              <p className="text-muted-foreground">Planned Trips</p>
              <p className="text-lg font-semibold">{board?.tripCounts.planned ?? 0}</p>
            </div>
            <div className="rounded border p-3 text-sm">
              <p className="text-muted-foreground">In-Progress Trips</p>
              <p className="text-lg font-semibold">{board?.tripCounts.inProgress ?? 0}</p>
            </div>
            <div className="rounded border p-3 text-sm">
              <p className="text-muted-foreground">Open Incidents</p>
              <p className="text-lg font-semibold">{board?.openIncidents ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4 text-sm">
            <div className="rounded border p-3">
              <p className="text-muted-foreground">Available Vehicles</p>
              <p className="text-lg font-semibold">{availableVehicles.length}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-muted-foreground">Available Drivers</p>
              <p className="text-lg font-semibold">{availableDrivers.length}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-muted-foreground">Route Assignment Warnings</p>
              <p className="text-lg font-semibold">{routeWarnings.length}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-muted-foreground">Schedule Warnings</p>
              <p className="text-lg font-semibold">{scheduleWarnings.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warning Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading dispatch board...</p> : null}
            {!isLoading && routeWarnings.length === 0 && scheduleWarnings.length === 0 ? (
              <p className="text-muted-foreground">No immediate warnings for selected branch.</p>
            ) : null}
            {routeWarnings.map((trip) => (
              <div key={`route-${trip.id}`} className="rounded border p-3">
                <p className="font-medium">{trip.tripNo}: route assignment missing</p>
                <p className="text-muted-foreground">
                  Vehicle {trip.vehiclePlateNumber ?? trip.vehicleId} | Driver{' '}
                  {trip.driverEmployeeName ?? trip.driverEmployeeId}
                </p>
              </div>
            ))}
            {scheduleWarnings.map((trip) => (
              <div key={`schedule-${trip.id}`} className="rounded border p-3">
                <p className="font-medium">{trip.tripNo}: schedule is incomplete</p>
                <p className="text-muted-foreground">
                  Planned start/end must be filled for dispatch planning.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isLoading && filteredActive.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No in-progress trips in selected branch.
              </p>
            ) : null}
            {filteredActive.map((trip) => (
              <div key={trip.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{trip.tripNo}</p>
                <p className="text-muted-foreground">
                  {tripStatusLabel(trip.status)} | Vehicle{' '}
                  {trip.vehiclePlateNumber ?? trip.vehicleId} | Driver{' '}
                  {trip.driverEmployeeName ?? trip.driverEmployeeId}
                </p>
                <p className="text-muted-foreground">
                  Route: {trip.routePlanName ?? 'Unassigned'} | Started:{' '}
                  {trip.startedAt ? new Date(trip.startedAt).toLocaleString() : '-'}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/fleet-transport/trips/view/${trip.id}`}>Trip Detail</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/fleet-transport/dispatch/live-status">Live Status</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
