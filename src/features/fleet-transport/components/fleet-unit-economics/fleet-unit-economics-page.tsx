import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetUnitEconomicsQuery } from '../../api/fleet-transport.api';
import { downloadCsv } from '@/features/dashboard/utils/export-csv';

function fmt(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetUnitEconomicsPage() {
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

  const { data, isLoading, refetch } = useGetFleetUnitEconomicsQuery(query);
  const onExportCsv = () => {
    downloadCsv(
      `fleet-unit-economics-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Type', 'Name', 'Trips', 'Cost/KM', 'Cost/Trip', 'Cost/Parcel', 'Total Fuel Cost'],
      [
        ...(data?.profitabilityByRoute ?? []).map((row) => [
          'Route',
          row.routePlanName ?? 'Unassigned Route',
          row.trips,
          row.costPerKm,
          row.costPerTrip,
          row.costPerParcel,
          row.totalFuelCostPsw,
        ]),
        ...(data?.profitabilityByBranch ?? []).map((row) => [
          'Branch',
          row.branchName ?? 'Unassigned Branch',
          row.trips,
          row.costPerKm,
          row.costPerTrip,
          row.costPerParcel,
          row.totalFuelCostPsw,
        ]),
      ],
    );
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics</CardTitle>
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
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onExportCsv}
              disabled={
                (data?.profitabilityByRoute.length ?? 0) === 0 &&
                (data?.profitabilityByBranch.length ?? 0) === 0
              }
            >
              Export CSV
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading unit economics...</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Routes: {data?.summary.routeCount ?? 0}</p>
            <p>Branches: {data?.summary.branchCount ?? 0}</p>
            <p>Customers: {data?.summary.customerCount ?? 0}</p>
            <p>Trend months: {data?.summary.trendMonths ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Route Cost per KM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.benchmarkCuts.topRouteCostPerKm.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No route economics records in selected window.
              </p>
            ) : null}
            {data?.benchmarkCuts.topRouteCostPerKm.map((row) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Top Branch Cost per Parcel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.benchmarkCuts.topBranchCostPerParcel.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No branch economics records in selected window.
              </p>
            ) : null}
            {data?.benchmarkCuts.topBranchCostPerParcel.map((row) => (
              <div key={row.branchId ?? 'unassigned'} className="rounded border p-3">
                <p className="font-medium">{row.branchName ?? 'Unassigned Branch'}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Cost/KM: {fmt(row.costPerKm)} | Cost/Trip:{' '}
                  {fmt(row.costPerTrip)} | Cost/Parcel: {fmt(row.costPerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lowest Margin Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.benchmarkCuts.lowestMarginCustomers.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No customer economics records in selected window.
              </p>
            ) : null}
            {data?.benchmarkCuts.lowestMarginCustomers.map((row) => (
              <div key={row.senderId} className="rounded border p-3">
                <p className="font-medium">{row.senderName ?? row.senderId}</p>
                <p className="text-muted-foreground">
                  Trips: {row.trips} | Parcels: {row.totalParcelCount} | Revenue:{' '}
                  {fmt(row.totalRevenuePsw)} | Fuel cost: {fmt(row.totalFuelCostPsw)}
                </p>
                <p className="text-muted-foreground">
                  Margin: {fmt(row.marginPsw)} | Revenue/Parcel: {fmt(row.revenuePerParcel)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
