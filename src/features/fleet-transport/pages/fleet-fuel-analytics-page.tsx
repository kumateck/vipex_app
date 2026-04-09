import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetFuelAnalyticsQuery,
  useListFleetVehicleOptionsQuery,
} from '../api/fleet-transport.api';

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function FleetFuelAnalyticsPage() {
  const [vehicleId, setVehicleId] = useState('__all__');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [thresholdPct, setThresholdPct] = useState('20');
  const [baselineKmPerLiter, setBaselineKmPerLiter] = useState('6');
  const [limit, setLimit] = useState('100');

  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery();
  const query = useMemo(
    () => ({
      vehicleId: vehicleId === '__all__' ? undefined : vehicleId,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      expectedOveruseThresholdPct: thresholdPct.trim() ? Number(thresholdPct) : 20,
      defaultExpectedKmPerLiter: baselineKmPerLiter.trim() ? Number(baselineKmPerLiter) : 6,
      limit: limit.trim() ? Number(limit) : 100,
    }),
    [baselineKmPerLiter, dateFrom, dateTo, limit, thresholdPct, vehicleId],
  );

  const { data, isLoading, refetch } = useGetFleetFuelAnalyticsQuery(query);

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Analytics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <Input
              type="datetime-local"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
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
            <Input
              type="number"
              min={1}
              max={300}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? <p>Loading analytics...</p> : null}
            <p>Trips analyzed: {data?.summary.tripsAnalyzed ?? 0}</p>
            <p>Anomalies: {data?.summary.anomalyCount ?? 0}</p>
            <p>Expected liters: {formatNumber(data?.summary.totalExpectedLiters ?? 0)}</p>
            <p>Actual liters: {formatNumber(data?.summary.totalActualLiters ?? 0)}</p>
            <p>Variance liters: {formatNumber(data?.summary.totalVarianceLiters ?? 0)}</p>
            <p>Fuel cost: {(data?.summary.totalFuelCostPsw ?? 0).toLocaleString()}</p>
            <p>
              Avg cost/km:{' '}
              {typeof data?.summary.averageCostPerKm === 'number'
                ? formatNumber(data.summary.averageCostPerKm)
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip-Level Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed trips for selected filter.
              </p>
            ) : null}
            {data?.data.map((row) => (
              <div key={row.tripId} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {row.tripNo} - {row.vehiclePlateNumber ?? row.vehicleId}
                </p>
                <p className="text-muted-foreground">
                  Distance: {formatNumber(row.distanceKm)} km | Expected:{' '}
                  {formatNumber(row.expectedLiters)} L | Actual: {formatNumber(row.actualLiters)} L
                  | Variance: {formatNumber(row.varianceLiters)} L ({formatNumber(row.variancePct)}
                  %)
                </p>
                <p className="text-muted-foreground">
                  Cost: {row.fuelCostPsw.toLocaleString()} | Cost/KM:{' '}
                  {typeof row.costPerKm === 'number' ? formatNumber(row.costPerKm) : '-'} | Fuel
                  logs: {row.approvedFuelLogCount}
                </p>
                <p className="text-muted-foreground">
                  Window: {formatDateTime(row.startedAt)} - {formatDateTime(row.endedAt)} |
                  Benchmark: {formatNumber(row.benchmarkKmPerLiter)} km/l
                </p>
                {row.anomaly ? <p className="font-medium text-red-600">Anomaly flagged</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
