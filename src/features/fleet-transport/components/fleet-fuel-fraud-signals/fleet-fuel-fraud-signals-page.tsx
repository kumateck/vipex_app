import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetFuelFraudSignalsQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';
import { downloadCsv } from '@/features/dashboard/utils/export-csv';
import { useListBranchOptionsQuery } from '@/features/branches';

function fmt(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetFuelFraudSignalsPage() {
  const [vehicleId, setVehicleId] = useState('__all__');
  const [branchId, setBranchId] = useState('__all__');
  const [fuelType, setFuelType] = useState('__all__');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState('200');
  const [highCostPerKmThreshold, setHighCostPerKmThreshold] = useState('3');
  const [rapidRefuelHours, setRapidRefuelHours] = useState('12');

  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery();
  const { data: branches = [] } = useListBranchOptionsQuery();
  const query = useMemo(
    () => ({
      branchId: branchId === '__all__' ? undefined : branchId,
      vehicleId: vehicleId === '__all__' ? undefined : vehicleId,
      fuelType: fuelType === '__all__' ? undefined : Number(fuelType),
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      limit: limit.trim() ? Number(limit) : 200,
      highCostPerKmThreshold: highCostPerKmThreshold.trim() ? Number(highCostPerKmThreshold) : 3,
      rapidRefuelHours: rapidRefuelHours.trim() ? Number(rapidRefuelHours) : 12,
    }),
    [
      branchId,
      dateFrom,
      dateTo,
      fuelType,
      highCostPerKmThreshold,
      limit,
      rapidRefuelHours,
      vehicleId,
    ],
  );

  const { data, isLoading, refetch } = useGetFleetFuelFraudSignalsQuery(query);
  const onExportCsv = () => {
    downloadCsv(
      `fleet-fuel-fraud-signals-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Trip No',
        'Vehicle',
        'Risk Level',
        'Rule Hits',
        'Variance %',
        'Cost/KM',
        'Effective Cost/KM Threshold',
        'High Variance',
        'High Cost/KM',
        'Rapid Refuel Pattern',
      ],
      (data?.data ?? []).map((row) => [
        row.tripNo,
        row.vehiclePlateNumber ?? row.vehicleId,
        row.riskLevel,
        row.ruleHits,
        row.variancePct,
        row.costPerKm ?? '',
        row.effectiveHighCostPerKmThreshold,
        row.flags.highVariance ? 'Yes' : 'No',
        row.flags.highCostPerKm ? 'Yes' : 'No',
        row.flags.rapidRefuelPattern ? 'Yes' : 'No',
      ]),
    );
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Fraud Signals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
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
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="All fuel types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All fuel types</SelectItem>
                <SelectItem value="0">Petrol</SelectItem>
                <SelectItem value="1">Diesel</SelectItem>
                <SelectItem value="2">Electric</SelectItem>
                <SelectItem value="3">Hybrid</SelectItem>
                <SelectItem value="4">Gas</SelectItem>
                <SelectItem value="5">Other</SelectItem>
              </SelectContent>
            </Select>
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
              value={highCostPerKmThreshold}
              onChange={(event) => setHighCostPerKmThreshold(event.target.value)}
              placeholder="High cost/km threshold"
            />
            <Input
              type="number"
              min={1}
              max={72}
              value={rapidRefuelHours}
              onChange={(event) => setRapidRefuelHours(event.target.value)}
              placeholder="Rapid refuel window hours"
            />
            <Input
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={onExportCsv}
                disabled={(data?.data.length ?? 0) === 0}
              >
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading fraud signals...</p> : null}
            <p>Trips analyzed: {data?.summary.tripsAnalyzed ?? 0}</p>
            <p>Flagged trips: {data?.summary.flaggedTrips ?? 0}</p>
            <p>High risk: {data?.summary.highRiskTrips ?? 0}</p>
            <p>Medium risk: {data?.summary.mediumRiskTrips ?? 0}</p>
            <p>Low risk: {data?.summary.lowRiskTrips ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flagged Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No records in selected window.</p>
            ) : null}
            {data?.data.map((row) => (
              <div key={row.tripId} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {row.tripNo} | Risk: <span className="uppercase">{row.riskLevel}</span> | Rule
                  hits: {row.ruleHits}
                </p>
                <p className="text-muted-foreground">
                  Vehicle: {row.vehiclePlateNumber ?? row.vehicleId} | Distance:{' '}
                  {fmt(row.distanceKm)} km | Cost/KM:{' '}
                  {typeof row.costPerKm === 'number' ? fmt(row.costPerKm) : '-'}
                </p>
                <p className="text-muted-foreground">
                  Variance: {fmt(row.variancePct)}% | High variance:{' '}
                  {row.flags.highVariance ? 'Yes' : 'No'} | High cost/km:{' '}
                  {row.flags.highCostPerKm ? 'Yes' : 'No'} | Rapid refuel:{' '}
                  {row.flags.rapidRefuelPattern ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
