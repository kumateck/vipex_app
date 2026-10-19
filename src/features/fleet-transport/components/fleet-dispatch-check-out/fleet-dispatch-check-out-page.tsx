import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetTripCheckOutMutation,
  useListFleetTripEventsQuery,
  useListFleetTripsQuery,
} from '../../api/fleet-transport.api';

export function FleetDispatchCheckOutPage() {
  const [branchId, setBranchId] = useState('__all__');
  const [tripId, setTripId] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [note, setNote] = useState('');

  const { data: branches = [] } = useListBranchOptionsQuery();
  const { data: trips } = useListFleetTripsQuery({ pageSize: 200, filters: { status: 1 } });
  const { data: events = [] } = useListFleetTripEventsQuery({ id: tripId }, { skip: !tripId });
  const [checkOut, { isLoading }] = useCreateFleetTripCheckOutMutation();

  const selectedBranchId = branchId === '__all__' ? null : branchId;

  const visibleTrips = useMemo(() => {
    const rows = trips?.data ?? [];
    if (!selectedBranchId) return rows;
    return rows.filter((trip) => trip.branchId === selectedBranchId);
  }, [trips?.data, selectedBranchId]);

  const selectedTrip = useMemo(
    () => visibleTrips.find((trip) => trip.id === tripId) ?? null,
    [visibleTrips, tripId],
  );

  const onSubmit = async () => {
    if (!tripId) {
      toast.error('Select a trip');
      return;
    }
    if (!odometerKm.trim()) {
      toast.error('Odometer is required');
      return;
    }
    if (!locationLabel.trim()) {
      toast.error('Location label is required');
      return;
    }

    try {
      await checkOut({
        id: tripId,
        occurredAt: occurredAt.trim() ? new Date(occurredAt).toISOString() : null,
        odometerKm: Number(odometerKm),
        locationLabel: locationLabel.trim(),
        note: note.trim() || null,
      }).unwrap();

      toast.success('Check-out recorded');
      setOccurredAt('');
      setOdometerKm('');
      setLocationLabel('');
      setNote('');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to record check-out');
    }
  };

  const checkOutEvents = useMemo(() => events.filter((event) => event.eventType === 1), [events]);

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Check-Out Operator</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/fleet-transport/dispatch/board">Back to dispatch board</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
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

            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Select in-progress trip" />
              </SelectTrigger>
              <SelectContent>
                {visibleTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.tripNo} - {trip.vehiclePlateNumber ?? trip.vehicleId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateTimePicker
              value={occurredAt ? new Date(occurredAt) : undefined}
              onChange={(value) => setOccurredAt(value ? value.toISOString() : '')}
              placeholder="Occurred at"
            />

            <Input
              type="number"
              min={0}
              value={odometerKm}
              onChange={(event) => setOdometerKm(event.target.value)}
              placeholder="Odometer (km)"
            />

            <Input
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder="Location label"
            />

            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note"
            />

            <div className="md:col-span-2 flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading || !tripId}>
                Record check-out
              </Button>
              {selectedTrip ? (
                <Button asChild variant="outline">
                  <Link to={`/fleet-transport/trips/view/${selectedTrip.id}`}>
                    Open trip detail
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Check-Out Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!tripId ? (
              <p className="text-muted-foreground">Select a trip to see check-out history.</p>
            ) : null}
            {tripId && checkOutEvents.length === 0 ? (
              <p className="text-muted-foreground">
                No check-out events recorded for this trip yet.
              </p>
            ) : null}
            {checkOutEvents.map((event) => (
              <div key={event.id} className="rounded border p-3">
                <p className="font-medium">{formatDateTimeShared(event.occurredAt)}</p>
                <p className="text-muted-foreground">
                  Odometer: {event.odometerKm ?? '-'} | Location: {event.locationLabel ?? '-'}
                </p>
                <p className="text-muted-foreground">Note: {event.note ?? '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
