import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetDispatchOpsPerformanceQuery } from '../api/fleet-transport.api';

function fmt(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetDispatchOpsPerformancePage() {
  const [windowDays, setWindowDays] = useState('30');
  const { data, isLoading, refetch } = useGetFleetDispatchOpsPerformanceQuery({
    windowDays: windowDays.trim() ? Number(windowDays) : 30,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Dispatch Ops Performance</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/fleet-transport/dispatch/board">Back to dispatch board</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min={1}
              max={180}
              value={windowDays}
              onChange={(event) => setWindowDays(event.target.value)}
              placeholder="Window days"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading performance metrics...</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage KPIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Window: {data?.summary.windowDays ?? 0} days</p>
            <p>Route assignment coverage: {fmt(data?.summary.routeAssignmentCoveragePct ?? 0)}%</p>
            <p>On-time completion: {fmt(data?.summary.onTimeCompletionPct ?? 0)}%</p>
            <p>Check-out coverage: {fmt(data?.summary.checkOutCoveragePct ?? 0)}%</p>
            <p>Delayed updates: {data?.summary.delayedUpdates ?? 0}</p>
            <p>Stopped updates: {data?.summary.stoppedUpdates ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip and Load Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Trips - Planned: {data?.tripStats.plannedTrips ?? 0}, In-progress:{' '}
              {data?.tripStats.inProgressTrips ?? 0}, Completed:{' '}
              {data?.tripStats.completedTrips ?? 0}
            </p>
            <p>
              Completed on time: {data?.tripStats.onTimeCompletedTrips ?? 0} | Planned with route:{' '}
              {data?.tripStats.plannedTripsWithRoute ?? 0}
            </p>
            <p>
              Check events - In: {data?.checkEventStats.checkInEvents ?? 0}, Out:{' '}
              {data?.checkEventStats.checkOutEvents ?? 0}
            </p>
            <p>
              Trips with check-in: {data?.checkEventStats.tripsWithCheckIn ?? 0} | Trips with
              check-out: {data?.checkEventStats.tripsWithCheckOut ?? 0}
            </p>
            <p>
              Loads - Assigned: {data?.loadStats.assignedLoads ?? 0}, Loaded:{' '}
              {data?.loadStats.loadedLoads ?? 0}, Unloaded: {data?.loadStats.unloadedLoads ?? 0},
              Cancelled: {data?.loadStats.cancelledLoads ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
