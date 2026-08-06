import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetTripQuery, useStartFleetTripMutation } from '../../api/fleet-transport.api';

export function FleetTripStartPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const tripId = params.id ?? '';
  const [startOdometerKm, setStartOdometerKm] = useState('');
  const [note, setNote] = useState('');

  const { data: trip, isLoading } = useGetFleetTripQuery(tripId, { skip: !tripId });
  const [startTrip, { isLoading: saving }] = useStartFleetTripMutation();

  const onSubmit = async () => {
    if (!tripId) return;
    const parsedOdometer = startOdometerKm.trim() ? Number(startOdometerKm) : null;
    if (parsedOdometer === null) {
      toast.error('Start odometer is required');
      return;
    }

    if (
      !Number.isFinite(parsedOdometer) ||
      parsedOdometer < 0 ||
      !Number.isInteger(parsedOdometer)
    ) {
      toast.error('Start odometer must be a non-negative integer');
      return;
    }

    try {
      await startTrip({
        id: tripId,
        startOdometerKm: parsedOdometer,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Trip started');
      navigate('/fleet-transport/trips');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start trip');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Start Trip: {trip?.tripNo ?? tripId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <p>Loading trip...</p> : null}
            {trip && trip.status !== 0 ? (
              <p className="text-sm text-muted-foreground">
                This process only runs for planned trips.
              </p>
            ) : null}

            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Start Odometer (km)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={startOdometerKm}
                  onChange={(e) => setStartOdometerKm(e.target.value)}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Start Note</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={saving || trip?.status !== 0}>
                Start trip
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
