import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetMaintenanceDashboardQuery } from '../api/fleet-transport.api';

export function FleetMaintenancePage() {
  const { data: dashboard, isLoading: loadingDashboard } = useGetFleetMaintenanceDashboardQuery({
    horizonDays: 14,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Reliability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/fleet-transport/maintenance/plans/new">Create Preventive Plan</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/maintenance/work-orders/new">Create Work Order</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/work-orders">Work Orders List</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/maintenance/downtime/new">Start Downtime</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime">Downtime Events</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/maintenance/parts/new">Create Part</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/maintenance/parts/movements/new">
                  Post Stock Movement
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/parts/movements">
                  Stock Movement History
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/procurement-linkage">
                  Procurement Linkage
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/work-orders/part-movements">
                  Work Order Part Movements
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime/workflows">
                  Downtime RCA Workflows
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/reliability/trends">Reliability Trends</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/kpis">KPI Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/procurement/traceability">
                  Procurement Traceability
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/procurement/reorder">Run Reorder Job</Link>
              </Button>
            </div>

            {loadingDashboard ? (
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            ) : null}
            <p className="text-sm">
              Overdue plans: {dashboard?.summary.overduePlans ?? 0} | Due soon:{' '}
              {dashboard?.summary.dueSoonPlans ?? 0} | Open work orders:{' '}
              {dashboard?.summary.openWorkOrders ?? 0} | Active downtime:{' '}
              {dashboard?.summary.activeDowntime ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reliability (MTBF/MTTR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboard?.reliability.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No reliability data yet.</p>
            ) : null}
            {dashboard?.reliability.map((item) => (
              <div key={item.vehicleId} className="rounded border p-3 text-sm">
                <p className="font-medium">{item.vehiclePlateNumber ?? item.vehicleId}</p>
                <p className="text-muted-foreground">
                  Failures: {item.failureCount} | MTBF(hours):{' '}
                  {typeof item.mtbfHours === 'number' ? item.mtbfHours.toFixed(2) : '-'} |
                  MTTR(min):{' '}
                  {typeof item.mttrMinutes === 'number' ? item.mttrMinutes.toFixed(2) : '-'} |
                  Downtime(min): {item.totalDowntimeMinutes.toFixed(2)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
