import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useCreateFleetVehicleMutation } from '../../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function FleetVehiclesCreatePage() {
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [ownershipType, setOwnershipType] = useState('0');
  const [lessorName, setLessorName] = useState('');
  const [leaseStartAt, setLeaseStartAt] = useState('');
  const [leaseEndAt, setLeaseEndAt] = useState('');
  const [fuelType, setFuelType] = useState('1');
  const [expectedKmPerLiter, setExpectedKmPerLiter] = useState('');
  const [tankCapacityLiters, setTankCapacityLiters] = useState('');
  const [payloadCapacityKg, setPayloadCapacityKg] = useState('');
  const [cargoCapacityCbm, setCargoCapacityCbm] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState('0');
  const [insuranceExpiryAt, setInsuranceExpiryAt] = useState('');
  const [roadworthyExpiryAt, setRoadworthyExpiryAt] = useState('');
  const [createVehicle, { isLoading }] = useCreateFleetVehicleMutation();

  const onSubmit = async () => {
    if (!plateNumber.trim() || !model.trim()) {
      toast.error('Plate number and model are required');
      return;
    }

    try {
      await createVehicle({
        plateNumber: plateNumber.trim(),
        model: model.trim(),
        year: year.trim() ? Number(year) : null,
        vin: vin.trim() || null,
        ownershipType: Number(ownershipType),
        lessorName: lessorName.trim() || null,
        leaseStartAt: leaseStartAt ? new Date(leaseStartAt).toISOString() : null,
        leaseEndAt: leaseEndAt ? new Date(leaseEndAt).toISOString() : null,
        fuelType: Number(fuelType),
        expectedKmPerLiter: expectedKmPerLiter.trim() ? Number(expectedKmPerLiter) : null,
        tankCapacityLiters: tankCapacityLiters.trim() ? Number(tankCapacityLiters) : null,
        payloadCapacityKg: payloadCapacityKg.trim() ? Number(payloadCapacityKg) : null,
        cargoCapacityCbm: cargoCapacityCbm.trim() ? Number(cargoCapacityCbm) : null,
        lifecycleStatus: Number(lifecycleStatus),
        insuranceExpiryAt: insuranceExpiryAt ? new Date(insuranceExpiryAt).toISOString() : null,
        roadworthyExpiryAt: roadworthyExpiryAt ? new Date(roadworthyExpiryAt).toISOString() : null,
      }).unwrap();
      toast.success('Vehicle created');
      navigate('/fleet-transport/vehicles');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create vehicle');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Plate number</FieldLabel>
                <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Model</FieldLabel>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Year</FieldLabel>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>VIN</FieldLabel>
                <Input value={vin} onChange={(e) => setVin(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Ownership</FieldLabel>
                <Select value={ownershipType} onValueChange={setOwnershipType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Company Owned</SelectItem>
                    <SelectItem value="1">Leased</SelectItem>
                    <SelectItem value="2">Third Party</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Fuel Type</FieldLabel>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Petrol</SelectItem>
                    <SelectItem value="1">Diesel</SelectItem>
                    <SelectItem value="2">Electric</SelectItem>
                    <SelectItem value="3">Hybrid</SelectItem>
                    <SelectItem value="4">Gas</SelectItem>
                    <SelectItem value="5">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Lifecycle Status</FieldLabel>
                <Select value={lifecycleStatus} onValueChange={setLifecycleStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lifecycle status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Active</SelectItem>
                    <SelectItem value="1">In Maintenance</SelectItem>
                    <SelectItem value="2">Retired</SelectItem>
                    <SelectItem value="3">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Expected KM/L</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={expectedKmPerLiter}
                  onChange={(e) => setExpectedKmPerLiter(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Tank Capacity (liters)</FieldLabel>
                <Input
                  type="number"
                  value={tankCapacityLiters}
                  onChange={(e) => setTankCapacityLiters(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Payload Capacity (kg)</FieldLabel>
                <Input
                  type="number"
                  value={payloadCapacityKg}
                  onChange={(e) => setPayloadCapacityKg(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Cargo Capacity (cbm)</FieldLabel>
                <Input
                  type="number"
                  value={cargoCapacityCbm}
                  onChange={(e) => setCargoCapacityCbm(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Lessor Name</FieldLabel>
                <Input value={lessorName} onChange={(e) => setLessorName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Lease Start</FieldLabel>
                <DateTimePicker
                  value={leaseStartAt ? new Date(leaseStartAt) : undefined}
                  onChange={(value) => setLeaseStartAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>Lease End</FieldLabel>
                <DateTimePicker
                  value={leaseEndAt ? new Date(leaseEndAt) : undefined}
                  onChange={(value) => setLeaseEndAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>Insurance Expiry</FieldLabel>
                <DateTimePicker
                  value={insuranceExpiryAt ? new Date(insuranceExpiryAt) : undefined}
                  onChange={(value) => setInsuranceExpiryAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>Roadworthy Expiry</FieldLabel>
                <DateTimePicker
                  value={roadworthyExpiryAt ? new Date(roadworthyExpiryAt) : undefined}
                  onChange={(value) => setRoadworthyExpiryAt(value ? value.toISOString() : '')}
                />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save vehicle
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/vehicles')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
