import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateFleetVehicleMutation } from '../api/fleet-transport.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function FleetVehiclesCreatePage() {
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
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
