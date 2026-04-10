import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCloseFleetTripMutation, useGetFleetTripQuery } from '../../api/fleet-transport.api';

export function FleetTripClosePage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const tripId = params.id ?? '';
  const [endOdometerKm, setEndOdometerKm] = useState('');
  const [note, setNote] = useState('');

  const { data: trip, isLoading } = useGetFleetTripQuery(tripId, { skip: !tripId });
  const [closeTrip, { isLoading: saving }] = useCloseFleetTripMutation();

  const onSubmit = async () => {
    if (!tripId) return;
    const parsedOdometer = endOdometerKm.trim() ? Number(endOdometerKm) : null;
    if (parsedOdometer === null) {
      toast.error('End odometer is required');
      return;
    }

    if (
      !Number.isFinite(parsedOdometer) ||
      parsedOdometer < 0 ||
      !Number.isInteger(parsedOdometer)
    ) {
      toast.error('End odometer must be a non-negative integer');
      return;
    }

    try {
      await closeTrip({
        id: tripId,
        endOdometerKm: parsedOdometer,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Trip closed');
      navigate('/fleet-transport/trips');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to close trip');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Close Trip: {trip?.tripNo ?? tripId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <p>Loading trip...</p> : null}
            {trip && trip.status !== 1 ? (
              <p className="text-sm text-muted-foreground">
                This process only runs for in-progress trips.
              </p>
            ) : null}

            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>End Odometer (km)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={endOdometerKm}
                  onChange={(e) => setEndOdometerKm(e.target.value)}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Close Note</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={saving || trip?.status !== 1}>
                Close trip
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/trips')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
