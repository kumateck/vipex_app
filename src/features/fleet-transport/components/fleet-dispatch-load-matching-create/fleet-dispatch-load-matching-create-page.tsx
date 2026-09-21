import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useAssignFleetTripLoadMatchMutation,
  useListFleetTripsQuery,
} from '../../api/fleet-transport.api';

export function FleetDispatchLoadMatchingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tripId, setTripId] = useState(searchParams.get('tripId') ?? '');
  const [parcelId, setParcelId] = useState(searchParams.get('parcelId') ?? '');
  const [note, setNote] = useState('');
  const { data: trips } = useListFleetTripsQuery({ pageSize: 100 });
  const [assignLoad, { isLoading }] = useAssignFleetTripLoadMatchMutation();

  const onSubmit = async () => {
    if (!tripId || !parcelId.trim()) {
      toast.error('Select trip and enter parcel ID');
      return;
    }
    try {
      await assignLoad({
        id: tripId,
        parcelId: parcelId.trim(),
        note: note.trim() || null,
      }).unwrap();
      toast.success('Load matched to trip');
      navigate('/fleet-transport/dispatch/load-matching');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to assign load');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Assign Trip Load</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet-transport/dispatch/load-matching">Back to load matches</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Select trip" />
              </SelectTrigger>
              <SelectContent>
                {trips?.data.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.tripNo} - {trip.vehiclePlateNumber ?? trip.vehicleId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={parcelId}
              onChange={(event) => setParcelId(event.target.value)}
              placeholder="Parcel ID"
            />
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
            />
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Assign load
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/fleet-transport/dispatch/load-matching')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
