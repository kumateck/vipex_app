import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetMaintenanceKpiDashboardQuery } from '../../api/fleet-transport.api';

function fmt(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number') return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetMaintenanceKpiDashboardPage() {
  const [windowDays, setWindowDays] = useState('30');
  const [slaHours, setSlaHours] = useState('48');

  const { data, isLoading, refetch } = useGetFleetMaintenanceKpiDashboardQuery({
    windowDays: windowDays.trim() ? Number(windowDays) : 30,
    slaHours: slaHours.trim() ? Number(slaHours) : 48,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Maintenance KPI Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                min={1}
                max={365}
                value={windowDays}
                onChange={(event) => setWindowDays(event.target.value)}
                placeholder="Window days"
              />
              <Input
                type="number"
                min={1}
                max={720}
                value={slaHours}
                onChange={(event) => setSlaHours(event.target.value)}
                placeholder="SLA hours"
              />
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading KPI dashboard...</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Window days: {data?.summary.windowDays ?? 0}</p>
            <p>Total work orders: {data?.summary.totalWorkOrders ?? 0}</p>
            <p>Open backlog: {data?.summary.openBacklog ?? 0}</p>
            <p>Due plans: {data?.summary.duePlans ?? 0}</p>
            <p>
              Preventive compliance: {fmt(data?.summary.preventiveCompliancePct)}% (
              {data?.summary.preventiveCompleted ?? 0} completed)
            </p>
            <p>
              SLA breaches: {data?.summary.slaBreachCount ?? 0} ({fmt(data?.summary.slaBreachPct)}%)
            </p>
            <p>Mean time to schedule: {fmt(data?.summary.meanTimeToScheduleHours)} h</p>
            <p>Mean time to repair: {fmt(data?.summary.meanTimeToRepairHours)} h</p>
            <p>Active downtime: {data?.summary.activeDowntime ?? 0}</p>
            <p>Average downtime: {fmt(data?.summary.averageDowntimeMinutes)} min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backlog Aging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>0-2 days: {data?.backlogAging.d0to2 ?? 0}</p>
            <p>3-7 days: {data?.backlogAging.d3to7 ?? 0}</p>
            <p>8-14 days: {data?.backlogAging.d8to14 ?? 0}</p>
            <p>15+ days: {data?.backlogAging.d15plus ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Downtime Reasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.topReasons.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No reason trends available in this window.</p>
            ) : null}
            {data?.topReasons.map((row) => (
              <div key={row.reason} className="rounded border p-3">
                <p className="font-medium">{row.reason}</p>
                <p className="text-muted-foreground">Count: {row.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
