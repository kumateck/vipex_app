import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetMaintenancePlanMutation,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetMaintenancePlanCreatePage() {
  const navigate = useNavigate();
  const { data: vehicleOptions = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const [createPlan, { isLoading: saving }] = useCreateFleetMaintenancePlanMutation();

  const [vehicleId, setVehicleId] = useState('');
  const [title, setTitle] = useState('');
  const [intervalUnit, setIntervalUnit] = useState('1');
  const [intervalValue, setIntervalValue] = useState('30');
  const [nextDueAt, setNextDueAt] = useState('');

  const onCreate = async () => {
    if (!vehicleId || !title.trim()) {
      toast.error('Vehicle and plan title are required');
      return;
    }
    try {
      await createPlan({
        vehicleId,
        title: title.trim(),
        intervalUnit: Number(intervalUnit),
        intervalValue: Number(intervalValue),
        nextDueAt: nextDueAt ? new Date(nextDueAt).toISOString() : null,
      }).unwrap();
      toast.success('Maintenance plan created');
      navigate('/fleet-transport/maintenance');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create plan');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Preventive Plan</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicleOptions.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Plan title (e.g. Oil service)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Select value={intervalUnit} onValueChange={setIntervalUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Interval unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">KM</SelectItem>
                <SelectItem value="1">Days</SelectItem>
                <SelectItem value="2">Weeks</SelectItem>
                <SelectItem value="3">Months</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              placeholder="Interval value"
              value={intervalValue}
              onChange={(event) => setIntervalValue(event.target.value)}
            />
            <DateTimePicker
              value={nextDueAt ? new Date(nextDueAt) : undefined}
              onChange={(value) => setNextDueAt(value ? value.toISOString() : '')}
              placeholder="Next due"
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Create plan
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/maintenance')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
