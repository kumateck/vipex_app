import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  useGetFleetDecisionSupportOverviewQuery,
  useRunFleetAnalyticsSnapshotJobMutation,
} from '../../api/fleet-transport.api';
import { FleetAnomalyBriefPanel } from './fleet-anomaly-brief-panel';

function fmt(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetDecisionSupportPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [thresholdPct, setThresholdPct] = useState('20');
  const [baselineKmPerLiter, setBaselineKmPerLiter] = useState('6');

  const query = useMemo(
    () => ({
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      expectedOveruseThresholdPct: thresholdPct.trim() ? Number(thresholdPct) : 20,
      defaultExpectedKmPerLiter: baselineKmPerLiter.trim() ? Number(baselineKmPerLiter) : 6,
    }),
    [baselineKmPerLiter, dateFrom, dateTo, thresholdPct],
  );

  const { data, isLoading, refetch } = useGetFleetDecisionSupportOverviewQuery(query);
  const [runSnapshot, { isLoading: runningSnapshot }] = useRunFleetAnalyticsSnapshotJobMutation();

  const briefTo = dateTo ? new Date(dateTo).toISOString() : new Date().toISOString();
  const briefFrom = dateFrom
    ? new Date(dateFrom).toISOString()
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const onRunSnapshot = async () => {
    try {
      const result = await runSnapshot({
        windowDays: 180,
        horizonDays: 60,
        expectedOveruseThresholdPct: thresholdPct.trim() ? Number(thresholdPct) : 20,
        defaultExpectedKmPerLiter: baselineKmPerLiter.trim() ? Number(baselineKmPerLiter) : 6,
      }).unwrap();
      toast.success(
        `Snapshot created. Fraud flagged trips: ${result.fraud.flaggedTrips}, incidents in window: ${result.compliance.incidentsInWindow}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run analytics snapshot');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Decision Support</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <DateTimePicker
              value={dateFrom ? new Date(dateFrom) : undefined}
              onChange={(value) => setDateFrom(value ? value.toISOString() : '')}
              placeholder="From"
            />
            <DateTimePicker
              value={dateTo ? new Date(dateTo) : undefined}
              onChange={(value) => setDateTo(value ? value.toISOString() : '')}
              placeholder="To"
            />
            <Input
              type="number"
              min={0}
              value={thresholdPct}
              onChange={(event) => setThresholdPct(event.target.value)}
              placeholder="Anomaly threshold %"
            />
            <Input
              type="number"
              min={0.1}
              step="0.1"
              value={baselineKmPerLiter}
              onChange={(event) => setBaselineKmPerLiter(event.target.value)}
              placeholder="Default expected KM/L"
            />
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
            <div>
              <Button onClick={onRunSnapshot} disabled={runningSnapshot}>
                Run Analytics Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization & On-Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading overview...</p> : null}
            <p>Planned trips: {data?.utilization.plannedTrips ?? 0}</p>
            <p>In-progress trips: {data?.utilization.inProgressTrips ?? 0}</p>
            <p>Completed trips: {data?.utilization.completedTrips ?? 0}</p>
            <p>On-time trips: {data?.onTimePerformance.onTimeTrips ?? 0}</p>
            <p>On-time %: {fmt(data?.onTimePerformance.onTimePct ?? 0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profitability by Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.profitabilityByRoute.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No route profitability records in selected window.
              </p>
            ) : null}
            {data?.profitabilityByRoute.map((row) => (
              <div key={row.routePlanId ?? 'unassigned'} className="rounded border p-3 text-sm">
                <p className="font-medium">{row.routePlanName ?? 'Unassigned Route'}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Distance: {fmt(row.totalDistanceKm)} km | Parcels:{' '}
                  {row.totalParcelCount}
                </p>
                <p className="text-muted-foreground">
                  Cost/KM: {fmt(row.costPerKm)} | Cost/Trip: {fmt(row.costPerTrip)} | Cost/Parcel:{' '}
                  {fmt(row.costPerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Scorecards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.driverScorecards.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No driver scorecard data in selected window.
              </p>
            ) : null}
            {data?.driverScorecards.map((row) => (
              <div key={row.driverEmployeeId} className="rounded border p-3 text-sm">
                <p className="font-medium">{row.driverEmployeeName ?? row.driverEmployeeId}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | On-time %: {fmt(row.onTimePct)} | Anomalies:{' '}
                  {row.anomalyCount}
                </p>
                <p className="text-muted-foreground">
                  Avg variance %: {fmt(row.averageVariancePct)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profitability by Branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.profitabilityByBranch.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No branch profitability data in selected window.
              </p>
            ) : null}
            {data?.profitabilityByBranch.map((row) => (
              <div key={row.branchId ?? 'unassigned'} className="rounded border p-3 text-sm">
                <p className="font-medium">{row.branchName ?? 'Unassigned Branch'}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Distance: {fmt(row.totalDistanceKm)} km | Parcels:{' '}
                  {row.totalParcelCount}
                </p>
                <p className="text-muted-foreground">
                  Cost/KM: {fmt(row.costPerKm)} | Cost/Trip: {fmt(row.costPerTrip)} | Cost/Parcel:{' '}
                  {fmt(row.costPerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profitability by Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.profitabilityByCustomer.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customer profitability data in selected window.
              </p>
            ) : null}
            {data?.profitabilityByCustomer.slice(0, 20).map((row) => (
              <div key={row.senderId} className="rounded border p-3 text-sm">
                <p className="font-medium">{row.senderName ?? row.senderId}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Parcels: {row.totalParcelCount} | Revenue:{' '}
                  {fmt(row.totalRevenuePsw)}
                </p>
                <p className="text-muted-foreground">
                  Fuel cost: {fmt(row.totalFuelCostPsw)} | Margin: {fmt(row.marginPsw)} |
                  Revenue/Parcel: {fmt(row.revenuePerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.monthlyTrends.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No monthly trend data in selected window.
              </p>
            ) : null}
            {data?.monthlyTrends.map((row) => (
              <div key={row.month} className="rounded border p-3 text-sm">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Distance: {fmt(row.totalDistanceKm)} km | Parcels:{' '}
                  {row.totalParcelCount}
                </p>
                <p className="text-muted-foreground">
                  Fuel cost: {fmt(row.totalFuelCostPsw)} | Revenue: {fmt(row.totalRevenuePsw)} |
                  Cost/Trip: {fmt(row.costPerTrip)} | Cost/Parcel: {fmt(row.costPerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <FleetAnomalyBriefPanel from={briefFrom} to={briefTo} />
      </div>
    </ScrollableWrapper>
  );
}
