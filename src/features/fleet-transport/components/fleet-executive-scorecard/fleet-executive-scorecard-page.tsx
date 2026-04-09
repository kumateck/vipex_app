import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetExecutiveScorecardQuery } from '../../api/fleet-transport.api';

function fmt(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number') return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetExecutiveScorecardPage() {
  const [onTimeTargetPct, setOnTimeTargetPct] = useState('92');
  const [routeCoverageTargetPct, setRouteCoverageTargetPct] = useState('95');
  const [checkOutCoverageTargetPct, setCheckOutCoverageTargetPct] = useState('95');
  const [mttrTargetHours, setMttrTargetHours] = useState('48');

  const query = useMemo(
    () => ({
      onTimeTargetPct: Number(onTimeTargetPct),
      routeCoverageTargetPct: Number(routeCoverageTargetPct),
      checkOutCoverageTargetPct: Number(checkOutCoverageTargetPct),
      mttrTargetHours: Number(mttrTargetHours),
    }),
    [checkOutCoverageTargetPct, mttrTargetHours, onTimeTargetPct, routeCoverageTargetPct],
  );

  const { data, isLoading, refetch } = useGetFleetExecutiveScorecardQuery(query);

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Executive Scorecard</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <Input
              type="number"
              min={0}
              max={100}
              value={onTimeTargetPct}
              onChange={(event) => setOnTimeTargetPct(event.target.value)}
              placeholder="On-time target %"
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={routeCoverageTargetPct}
              onChange={(event) => setRouteCoverageTargetPct(event.target.value)}
              placeholder="Route coverage target %"
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={checkOutCoverageTargetPct}
              onChange={(event) => setCheckOutCoverageTargetPct(event.target.value)}
              placeholder="Check-out coverage target %"
            />
            <Input
              type="number"
              min={1}
              max={720}
              value={mttrTargetHours}
              onChange={(event) => setMttrTargetHours(event.target.value)}
              placeholder="MTTR target hours"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scorecard Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? (
              <p className="text-muted-foreground">Loading executive scorecard...</p>
            ) : null}
            <p>Overall status: {data?.summary.overallStatus ?? '-'}</p>
            <p>
              Targets met: {data?.summary.metTargets ?? 0}/{data?.summary.totalTargets ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPIs vs Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.kpis.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No KPI records.</p>
            ) : null}
            {data?.kpis.map((row) => (
              <div key={row.key} className="rounded border p-3">
                <p className="font-medium">{row.label}</p>
                <p className="text-muted-foreground">
                  Actual: {fmt(row.actual)} | Target: {fmt(row.target)} | Direction:{' '}
                  {row.direction === 'higher_is_better' ? 'Higher is better' : 'Lower is better'}
                </p>
                <p className={row.meetsTarget ? 'text-emerald-600' : 'text-amber-600'}>
                  {row.meetsTarget ? 'On target' : 'Off target'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Driver Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.topDriverRisks.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No driver risk rows.</p>
            ) : null}
            {data?.topDriverRisks.map((row) => (
              <div key={row.driverEmployeeId} className="rounded border p-3">
                <p className="font-medium">{row.driverEmployeeName ?? row.driverEmployeeId}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Anomalies: {row.anomalyCount} | Avg variance %:{' '}
                  {fmt(row.averageVariancePct)} | On-time %: {fmt(row.onTimePct)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Route Cost Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.topRouteCostRisks.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No route cost risk rows.</p>
            ) : null}
            {data?.topRouteCostRisks.map((row) => (
              <div key={row.routePlanId ?? 'unassigned'} className="rounded border p-3">
                <p className="font-medium">{row.routePlanName ?? 'Unassigned Route'}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Cost/KM: {fmt(row.costPerKm)} | Cost/Trip:{' '}
                  {fmt(row.costPerTrip)} | Cost/Parcel: {fmt(row.costPerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
