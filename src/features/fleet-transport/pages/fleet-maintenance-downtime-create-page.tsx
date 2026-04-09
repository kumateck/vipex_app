import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetDowntimeEventMutation,
  useListFleetVehicleOptionsQuery,
} from '../api/fleet-transport.api';

export function FleetMaintenanceDowntimeCreatePage() {
  const navigate = useNavigate();
  const { data: vehicleOptions = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const [createDowntime, { isLoading: saving }] = useCreateFleetDowntimeEventMutation();

  const [vehicleId, setVehicleId] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const onCreate = async () => {
    if (!vehicleId || !reason.trim()) {
      toast.error('Vehicle and downtime reason are required');
      return;
    }
    try {
      await createDowntime({
        vehicleId,
        reason: reason.trim(),
        note: note.trim() || null,
      }).unwrap();
      toast.success('Downtime event created');
      navigate('/fleet-transport/maintenance');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create downtime');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Start Downtime Event</CardTitle>
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
              placeholder="Downtime reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <Input
              placeholder="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Start downtime
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
