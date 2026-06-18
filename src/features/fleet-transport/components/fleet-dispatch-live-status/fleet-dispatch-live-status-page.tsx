import { useMemo, useState } from 'react';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
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
  useGetFleetTripQuery,
  useGetFleetTripTimelineQuery,
  useListFleetTripsQuery,
} from '../../api/fleet-transport.api';

function tripStatusLabel(value: number) {
  if (value === 0) return 'Planned';
  if (value === 1) return 'In Progress';
  if (value === 2) return 'Completed';
  if (value === 3) return 'Cancelled';
  return 'Unknown';
}

function statusUpdateLabel(value: number) {
  if (value === 0) return 'En Route';
  if (value === 1) return 'At Pickup';
  if (value === 2) return 'At Dropoff';
  if (value === 3) return 'Delayed';
  if (value === 4) return 'Stopped';
  return 'Status Updated';
}

function inferTimelineLabel(item: { kind: string; payload: unknown }) {
  if (item.kind === 'trip_started') return 'Trip started';
  if (item.kind === 'trip_closed') return 'Trip closed';
  if (item.kind === 'check_event') {
    const payload = item.payload as
      | { eventType?: number; locationLabel?: string | null }
      | undefined;
    if (payload?.eventType === 0)
      return `Check-in${payload.locationLabel ? ` at ${payload.locationLabel}` : ''}`;
    if (payload?.eventType === 1)
      return `Check-out${payload.locationLabel ? ` at ${payload.locationLabel}` : ''}`;
    return 'Check event recorded';
  }
  if (item.kind === 'status_update') {
    const payload = item.payload as
      | { statusType?: number; locationLabel?: string | null }
      | undefined;
    return `${statusUpdateLabel(payload?.statusType ?? -1)}${payload?.locationLabel ? ` at ${payload.locationLabel}` : ''}`;
  }
  if (item.kind === 'load_assigned') return 'Load assigned';
  if (item.kind === 'load_loaded') return 'Load marked loaded';
  if (item.kind === 'load_unloaded') return 'Load marked unloaded';
  return item.kind;
}

export function FleetDispatchLiveStatusPage() {
  const [branchId, setBranchId] = useState('__all__');
  const [tripId, setTripId] = useState('');

  const { data: branches = [] } = useListBranchOptionsQuery();
  const { data: activeTrips, isLoading: loadingTrips } = useListFleetTripsQuery({
    pageSize: 200,
    filters: { status: 1 },
  });
  const { data: trip } = useGetFleetTripQuery(tripId, { skip: !tripId });
  const { data: timeline = [], isLoading: loadingTimeline } = useGetFleetTripTimelineQuery(
    { id: tripId },
    { skip: !tripId },
  );

  const selectedBranchId = branchId === '__all__' ? null : branchId;

  const visibleTrips = useMemo(() => {
    const rows = activeTrips?.data ?? [];
    if (!selectedBranchId) return rows;
    return rows.filter((item) => item.branchId === selectedBranchId);
  }, [activeTrips?.data, selectedBranchId]);

  const nonTelemetryTimeline = useMemo(
    () => timeline.filter((item) => item.kind !== 'telemetry'),
    [timeline],
  );

  const latestStatus = nonTelemetryTimeline[0] ?? null;

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Trip Live Status (Operational Events)</CardTitle>
            <Button asChild size="sm" variant="outline">
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

            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Select in-progress trip" />
              </SelectTrigger>
              <SelectContent>
                {visibleTrips.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.tripNo} - {item.vehiclePlateNumber ?? item.vehicleId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingTrips ? <p className="text-muted-foreground">Loading active trips...</p> : null}
            {!tripId ? (
              <p className="text-muted-foreground">Select a trip to view current status.</p>
            ) : null}
            {trip ? (
              <div className="rounded border p-3">
                <p className="font-medium">{trip.tripNo}</p>
                <p className="text-muted-foreground">
                  State: {tripStatusLabel(trip.status)} | Route:{' '}
                  {trip.routePlanName ?? 'Unassigned'}
                </p>
                <p className="text-muted-foreground">
                  Vehicle {trip.vehiclePlateNumber ?? trip.vehicleId} | Driver{' '}
                  {trip.driverEmployeeName ?? trip.driverEmployeeId}
                </p>
                <p className="text-muted-foreground">
                  Latest event: {latestStatus ? inferTimelineLabel(latestStatus) : 'No updates yet'}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/fleet-transport/trips/view/${trip.id}`}>Trip Detail</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/fleet-transport/dispatch/check-in">Check-In</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/fleet-transport/dispatch/check-out">Check-Out</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingTimeline ? <p className="text-muted-foreground">Loading timeline...</p> : null}
            {tripId && !loadingTimeline && nonTelemetryTimeline.length === 0 ? (
              <p className="text-muted-foreground">No operational timeline items for this trip.</p>
            ) : null}
            {nonTelemetryTimeline.map((item, index) => (
              <div key={`${item.kind}-${item.occurredAt}-${index}`} className="rounded border p-3">
                <p className="font-medium">{inferTimelineLabel(item)}</p>
                <p className="text-muted-foreground">{formatDateTimeShared(item.occurredAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
