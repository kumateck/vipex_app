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
  useCreateFleetMaintenanceWorkOrderMutation,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetMaintenanceWorkOrderCreatePage() {
  const navigate = useNavigate();
  const { data: vehicleOptions = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const [createWorkOrder, { isLoading: saving }] = useCreateFleetMaintenanceWorkOrderMutation();

  const [vehicleId, setVehicleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  const onCreate = async () => {
    if (!vehicleId || !title.trim()) {
      toast.error('Vehicle and work order title are required');
      return;
    }
    try {
      await createWorkOrder({
        vehicleId,
        title: title.trim(),
        description: description.trim() || null,
        estimatedCostPsw: estimatedCost.trim() ? Number(estimatedCost) : 0,
      }).unwrap();
      toast.success('Work order created');
      navigate('/fleet-transport/maintenance');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create work order');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Work Order</CardTitle>
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
              placeholder="Work order title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Estimated cost (psw)"
              value={estimatedCost}
              onChange={(event) => setEstimatedCost(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Create work order
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
