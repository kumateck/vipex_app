import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
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
  useAssignFleetTripRouteMutation,
  useGetFleetDispatchRouteAssignmentQueueQuery,
  useListFleetRoutePlansQuery,
} from '../../api/fleet-transport.api';
import { useMemo, useState } from 'react';

export function FleetDispatchRouteAssignmentPage() {
  const [branchId, setBranchId] = useState('__all__');
  const [tripId, setTripId] = useState('');
  const [routePlanId, setRoutePlanId] = useState('__none__');
  const selectedBranchId = branchId === '__all__' ? null : branchId;

  const { data: branches = [] } = useListBranchOptionsQuery();
  const { data: queue, isLoading } = useGetFleetDispatchRouteAssignmentQueueQuery({
    branchId: selectedBranchId ?? undefined,
    limit: 300,
  });
  const { data: routePlans = [] } = useListFleetRoutePlansQuery();
  const [assignRoute, { isLoading: saving }] = useAssignFleetTripRouteMutation();

  const visibleTrips = useMemo(() => {
    const rows = queue?.data ?? [];
    if (!selectedBranchId) return rows;
    return rows.filter((trip) => trip.branchId === selectedBranchId);
  }, [queue?.data, selectedBranchId]);

  const selectedTrip = useMemo(
    () => visibleTrips.find((trip) => trip.id === tripId) ?? null,
    [visibleTrips, tripId],
  );

  const suggestedRoutePlans = useMemo(() => {
    if (!selectedTrip?.branchId) return routePlans;
    const sameBranch = routePlans.filter((route) => route.branchId === selectedTrip.branchId);
    return sameBranch.length ? sameBranch : routePlans;
  }, [routePlans, selectedTrip?.branchId]);

  const onPickTrip = (id: string) => {
    setTripId(id);
    const trip = visibleTrips.find((item) => item.id === id);
    setRoutePlanId(trip?.routePlanId ?? '__none__');
  };

  const onAssign = async () => {
    if (!tripId) {
      toast.error('Select a trip');
      return;
    }
    try {
      await assignRoute({
        id: tripId,
        routePlanId: routePlanId === '__none__' ? null : routePlanId,
      }).unwrap();
      toast.success('Route assignment updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update route assignment');
    }
  };

  const missingAssignments = useMemo(
    () => visibleTrips.filter((trip) => !trip.routePlanId),
    [visibleTrips],
  );
  const conflictTrips = useMemo(
    () => visibleTrips.filter((trip) => trip.hasConflict),
    [visibleTrips],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Route Assignment Operator</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet-transport/dispatch/board">Back to dispatch board</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
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

            <Select value={tripId} onValueChange={onPickTrip}>
              <SelectTrigger>
                <SelectValue placeholder="Select planned trip" />
              </SelectTrigger>
              <SelectContent>
                {visibleTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.tripNo} - {trip.vehiclePlateNumber ?? trip.vehicleId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={routePlanId} onValueChange={setRoutePlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select route plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassign route</SelectItem>
                {suggestedRoutePlans.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button onClick={onAssign} disabled={saving || !tripId}>
                Save assignment
              </Button>
              {selectedTrip ? (
                <Button asChild variant="outline">
                  <Link to={`/fleet-transport/trips/view/${selectedTrip.id}`}>Open trip</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Trip Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading queue...</p> : null}
            {!isLoading && visibleTrips.length === 0 ? (
              <p className="text-muted-foreground">No planned trips for selected branch.</p>
            ) : null}
            <p>
              Missing route assignments:{' '}
              <span className="font-semibold">{missingAssignments.length}</span>
            </p>
            <p>
              Conflict trips: <span className="font-semibold">{conflictTrips.length}</span>
            </p>
            {visibleTrips.map((trip) => (
              <div key={trip.id} className="rounded border p-3">
                <p className="font-medium">{trip.tripNo}</p>
                <p className="text-muted-foreground">
                  Vehicle {trip.vehiclePlateNumber ?? trip.vehicleId} | Driver{' '}
                  {trip.driverEmployeeName ?? trip.driverEmployeeId}
                </p>
                <p className="text-muted-foreground">
                  Route: {trip.routePlanName ?? 'Unassigned'} | Planned Start:{' '}
                  {trip.plannedStartAt ? formatDateTimeShared(trip.plannedStartAt) : '-'}
                </p>
                <p className="text-muted-foreground">
                  Schedule complete: {trip.scheduleComplete ? 'Yes' : 'No'} | Vehicle conflict:{' '}
                  {trip.vehicleConflict ? 'Yes' : 'No'} | Driver conflict:{' '}
                  {trip.driverConflict ? 'Yes' : 'No'}
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => onPickTrip(trip.id)}>
                    Assign for this trip
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
