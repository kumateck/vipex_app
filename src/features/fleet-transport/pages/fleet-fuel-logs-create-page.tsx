import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateFleetFuelLogMutation,
  useListFleetVehicleOptionsQuery,
} from '../api/fleet-transport.api';

export function FleetFuelLogsCreatePage() {
  const navigate = useNavigate();
  const [vehicleId, setVehicleId] = useState('__none__');
  const [liters, setLiters] = useState('');
  const [fuelCostPsw, setFuelCostPsw] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [stationName, setStationName] = useState('');
  const [note, setNote] = useState('');
  const { data: vehicleOptions = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const vehicles = vehicleOptions;
  const [createFuelLog, { isLoading }] = useCreateFleetFuelLogMutation();

  const onSubmit = async () => {
    if (vehicleId === '__none__') {
      toast.error('Vehicle is required');
      return;
    }

    const parsedLiters = Number(liters);
    const parsedFuelCost = Number(fuelCostPsw);
    const parsedOdometer = odometerKm.trim() ? Number(odometerKm) : null;

    if (!Number.isFinite(parsedLiters) || parsedLiters <= 0) {
      toast.error('Liters must be greater than 0');
      return;
    }
    if (!Number.isFinite(parsedFuelCost) || parsedFuelCost < 0) {
      toast.error('Fuel cost must be a valid number');
      return;
    }
    if (parsedOdometer !== null && (!Number.isFinite(parsedOdometer) || parsedOdometer < 0)) {
      toast.error('Odometer must be a valid number');
      return;
    }

    try {
      await createFuelLog({
        vehicleId,
        liters: parsedLiters,
        fuelCostPsw: parsedFuelCost,
        odometerKm: parsedOdometer,
        stationName: stationName.trim() || null,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Fuel log created');
      navigate('/fleet-transport/fuel-logs');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create fuel log');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Fuel Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Vehicle</FieldLabel>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select vehicle</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Liters</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Fuel Cost (PSW)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={fuelCostPsw}
                  onChange={(e) => setFuelCostPsw(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Odometer (km)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Station Name</FieldLabel>
                <Input value={stationName} onChange={(e) => setStationName(e.target.value)} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save fuel log
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/fuel-logs')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
