import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetMaintenanceReliabilityTrendsQuery } from '../../api/fleet-transport.api';

function fmt(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number') return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetMaintenanceReliabilityTrendsPage() {
  const [windowDays, setWindowDays] = useState('90');
  const { data, isLoading, refetch } = useGetFleetMaintenanceReliabilityTrendsQuery({
    windowDays: windowDays.trim() ? Number(windowDays) : 90,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Reliability Trends</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min={7}
              max={365}
              value={windowDays}
              onChange={(event) => setWindowDays(event.target.value)}
              placeholder="Window days"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading trends...</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Window days: {data?.summary.windowDays ?? 0}</p>
            <p>Total failures: {data?.summary.totalFailures ?? 0}</p>
            <p>Total downtime minutes: {fmt(data?.summary.totalDowntimeMinutes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.monthly.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No monthly trend rows in this window.</p>
            ) : null}
            {data?.monthly.map((row) => (
              <div key={row.month} className="rounded border p-3">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">
                  Failures: {row.failures} | Downtime: {fmt(row.totalDowntimeMinutes)} min
                </p>
                <p className="text-muted-foreground">
                  MTBF: {fmt(row.mtbfHours)} h | MTTR: {fmt(row.mttrMinutes)} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.byVehicle.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No vehicle-level trend rows in this window.</p>
            ) : null}
            {data?.byVehicle.map((row) => (
              <div key={row.vehicleId} className="rounded border p-3">
                <p className="font-medium">{row.vehiclePlateNumber ?? row.vehicleId}</p>
                <p className="text-muted-foreground">
                  Failures: {row.failures} | Downtime: {fmt(row.totalDowntimeMinutes)} min
                </p>
                <p className="text-muted-foreground">
                  MTBF: {fmt(row.mtbfHours)} h | MTTR: {fmt(row.mttrMinutes)} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.byBranch.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No branch trend rows in this window.</p>
            ) : null}
            {data?.byBranch.map((row, index) => (
              <div key={`${row.branchId ?? 'unassigned'}-${index}`} className="rounded border p-3">
                <p className="font-medium">{row.branchId ?? 'Unassigned Branch'}</p>
                <p className="text-muted-foreground">
                  Failures: {row.failures} | Downtime: {fmt(row.totalDowntimeMinutes)} min
                </p>
                <p className="text-muted-foreground">
                  MTBF: {fmt(row.mtbfHours)} h | MTTR: {fmt(row.mttrMinutes)} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Vehicle Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.byVehicleClass.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No vehicle-class trend rows in this window.</p>
            ) : null}
            {data?.byVehicleClass.map((row) => (
              <div key={row.vehicleClass} className="rounded border p-3">
                <p className="font-medium">{row.vehicleClass}</p>
                <p className="text-muted-foreground">
                  Failures: {row.failures} | Downtime: {fmt(row.totalDowntimeMinutes)} min
                </p>
                <p className="text-muted-foreground">
                  MTBF: {fmt(row.mtbfHours)} h | MTTR: {fmt(row.mttrMinutes)} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Three-Month Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.forecast.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No forecast generated yet.</p>
            ) : null}
            {data?.forecast.map((row) => (
              <div key={row.month} className="rounded border p-3">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">
                  Projected failures: {fmt(row.projectedFailures)} | Projected downtime:{' '}
                  {fmt(row.projectedDowntimeMinutes)} min
                </p>
                <p className="text-muted-foreground">
                  Projected MTTR: {fmt(row.projectedMttrMinutes)} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
