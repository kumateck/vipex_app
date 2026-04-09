import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetDispatchExceptionQueueQuery } from '../api/fleet-transport.api';

function fmtDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function FleetDispatchExceptionQueuePage() {
  const [branchId, setBranchId] = useState('');
  const [limit, setLimit] = useState('300');

  const { data, isLoading, refetch } = useGetFleetDispatchExceptionQueueQuery({
    branchId: branchId.trim() || undefined,
    limit: limit.trim() ? Number(limit) : 300,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Exception Queue</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              placeholder="Branch id (optional)"
            />
            <Input
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading exceptions...</p> : null}
            <p>Total: {data?.summary.total ?? 0}</p>
            <p>Missing schedule: {data?.summary.missingSchedule ?? 0}</p>
            <p>Route unassigned: {data?.summary.routeUnassigned ?? 0}</p>
            <p>Resource conflict: {data?.summary.resourceConflict ?? 0}</p>
            <p>Delayed in-progress: {data?.summary.delayedInProgress ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exceptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No dispatch exceptions found for current filters.
              </p>
            ) : null}
            {data?.data.map((row) => (
              <div key={`${row.tripId}:${row.category}`} className="rounded border p-3">
                <p className="font-medium">
                  {row.tripNo} • {row.category.replaceAll('_', ' ')}
                </p>
                <p className="text-muted-foreground">
                  {row.branchName ?? row.branchId ?? '-'} • {row.vehiclePlateNumber} •{' '}
                  {row.driverEmployeeName ?? row.driverEmployeeId}
                </p>
                <p className="text-muted-foreground">{row.reason}</p>
                <p className="text-muted-foreground">
                  Planned: {fmtDate(row.plannedStartAt)} → {fmtDate(row.plannedEndAt)}
                </p>
                <p className="text-muted-foreground">
                  Started: {fmtDate(row.startedAt)} | Ended: {fmtDate(row.endedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
