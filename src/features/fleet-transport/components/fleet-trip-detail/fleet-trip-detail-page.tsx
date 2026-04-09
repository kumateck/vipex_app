import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useAssignFleetTripRouteMutation,
  useCreateFleetTripCheckInMutation,
  useCreateFleetTripCheckOutMutation,
  useGetFleetTripQuery,
  useListFleetRoutePlansQuery,
  useListFleetTripCrewQuery,
  useListFleetTripEventsQuery,
  useListFleetTripStatusUpdatesQuery,
  useListFleetTripTelemetryPointsQuery,
  useRecordFleetTripStatusUpdateMutation,
  useRecordFleetTripTelemetryPointMutation,
} from '../../api/fleet-transport.api';

function statusLabel(status: number) {
  if (status === 0) return 'Planned';
  if (status === 1) return 'In Progress';
  if (status === 2) return 'Completed';
  if (status === 3) return 'Cancelled';
  return 'Unknown';
}

function eventTypeLabel(eventType: number) {
  if (eventType === 0) return 'Check-in';
  if (eventType === 1) return 'Check-out';
  return 'Event';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function FleetTripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = params.id ?? '';

  const { data: trip, isLoading: loadingTrip } = useGetFleetTripQuery(tripId, { skip: !tripId });
  const { data: routePlans = [] } = useListFleetRoutePlansQuery();
  const { data: crew = [], isLoading: loadingCrew } = useListFleetTripCrewQuery(
    { id: tripId },
    { skip: !tripId },
  );
  const { data: events = [], isLoading: loadingEvents } = useListFleetTripEventsQuery(
    { id: tripId },
    { skip: !tripId },
  );
  const { data: statuses = [], isLoading: loadingStatuses } = useListFleetTripStatusUpdatesQuery(
    { id: tripId },
    { skip: !tripId },
  );
  const { data: telemetry = [], isLoading: loadingTelemetry } =
    useListFleetTripTelemetryPointsQuery({ id: tripId, limit: 50 }, { skip: !tripId });
  const [assignRoute, { isLoading: assigningRoute }] = useAssignFleetTripRouteMutation();
  const [createCheckIn, { isLoading: creatingCheckIn }] = useCreateFleetTripCheckInMutation();
  const [createCheckOut, { isLoading: creatingCheckOut }] = useCreateFleetTripCheckOutMutation();
  const [recordStatus, { isLoading: recordingStatus }] = useRecordFleetTripStatusUpdateMutation();
  const [recordTelemetry, { isLoading: recordingTelemetry }] =
    useRecordFleetTripTelemetryPointMutation();
  const [eventOdometerKm, setEventOdometerKm] = useState('');
  const [eventLocationLabel, setEventLocationLabel] = useState('');
  const [eventLatitude, setEventLatitude] = useState('');
  const [eventLongitude, setEventLongitude] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [statusType, setStatusType] = useState('0');
  const [statusLocationLabel, setStatusLocationLabel] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [telemetryLatitude, setTelemetryLatitude] = useState('');
  const [telemetryLongitude, setTelemetryLongitude] = useState('');
  const [telemetrySpeedKph, setTelemetrySpeedKph] = useState('');
  const [telemetryNote, setTelemetryNote] = useState('');

  const canStart = trip?.status === 0;
  const canClose = trip?.status === 1;

  const timeline = useMemo(
    () => [
      { label: 'Planned Start', value: formatDateTime(trip?.plannedStartAt) },
      { label: 'Started At', value: formatDateTime(trip?.startedAt) },
      { label: 'Planned End', value: formatDateTime(trip?.plannedEndAt) },
      { label: 'Ended At', value: formatDateTime(trip?.endedAt) },
    ],
    [trip?.plannedStartAt, trip?.plannedEndAt, trip?.startedAt, trip?.endedAt],
  );

  const onAssignRoute = async (value: string) => {
    if (!tripId) return;
    try {
      await assignRoute({
        id: tripId,
        routePlanId: value === '__none__' ? null : value,
      }).unwrap();
      toast.success(value === '__none__' ? 'Route unassigned' : 'Route assigned');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign route');
    }
  };

  const toNumberOrNull = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const onRecordCheckEvent = async (eventType: 'checkIn' | 'checkOut') => {
    if (!tripId) return;
    try {
      const payload = {
        id: tripId,
        odometerKm: eventOdometerKm.trim() ? toNumberOrNull(eventOdometerKm) : null,
        locationLabel: eventLocationLabel.trim() || null,
        latitude: eventLatitude.trim() ? toNumberOrNull(eventLatitude) : null,
        longitude: eventLongitude.trim() ? toNumberOrNull(eventLongitude) : null,
        note: eventNote.trim() || null,
      };
      if (eventType === 'checkIn') {
        await createCheckIn(payload).unwrap();
      } else {
        await createCheckOut(payload).unwrap();
      }
      setEventOdometerKm('');
      setEventLocationLabel('');
      setEventLatitude('');
      setEventLongitude('');
      setEventNote('');
      toast.success(eventType === 'checkIn' ? 'Check-in recorded' : 'Check-out recorded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record trip event');
    }
  };

  const onRecordStatus = async () => {
    if (!tripId) return;
    try {
      await recordStatus({
        id: tripId,
        statusType: Number(statusType),
        locationLabel: statusLocationLabel.trim() || null,
        note: statusNote.trim() || null,
      }).unwrap();
      setStatusLocationLabel('');
      setStatusNote('');
      toast.success('Trip status update recorded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record status update');
    }
  };

  const onRecordTelemetry = async () => {
    if (!tripId) return;
    const latitude = toNumberOrNull(telemetryLatitude);
    const longitude = toNumberOrNull(telemetryLongitude);
    if (latitude === null || longitude === null) {
      toast.error('Telemetry latitude and longitude are required');
      return;
    }

    try {
      await recordTelemetry({
        id: tripId,
        latitude,
        longitude,
        speedKph: telemetrySpeedKph.trim() ? toNumberOrNull(telemetrySpeedKph) : null,
        source: telemetryNote.trim() || null,
      }).unwrap();
      setTelemetryLatitude('');
      setTelemetryLongitude('');
      setTelemetrySpeedKph('');
      setTelemetryNote('');
      toast.success('Telemetry point recorded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record telemetry');
    }
  };

  const latestTelemetry = telemetry[0];
  const overspeedThreshold = 90;
  const isOverspeeding =
    typeof latestTelemetry?.speedKph === 'number' && latestTelemetry.speedKph > overspeedThreshold;
  const likelyIdle =
    telemetry.length >= 3 &&
    telemetry.slice(0, 3).every((row) => {
      if (typeof row.speedKph === 'number') return row.speedKph < 3;
      return false;
    });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Trip Detail: {trip?.tripNo ?? tripId}</CardTitle>
            <div className="flex gap-2">
              {canStart ? (
                <Button asChild variant="outline">
                  <Link to={`/fleet-transport/trips/start/${tripId}`}>Start Process</Link>
                </Button>
              ) : null}
              {canClose ? (
                <Button asChild variant="outline">
                  <Link to={`/fleet-transport/trips/close/${tripId}`}>Close Process</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to={`/fleet-transport/trips/crew/${tripId}`}>Crew Process</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/trips">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTrip ? <p>Loading trip...</p> : null}

            {trip ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Trip No</p>
                  <p className="font-medium">{trip.tripNo}</p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{statusLabel(trip.status)}</p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{trip.vehiclePlateNumber ?? trip.vehicleId}</p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">{trip.driverEmployeeName ?? trip.driverEmployeeId}</p>
                </div>
                <div className="rounded border p-3 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Route Plan</p>
                  <p className="font-medium">{trip.routePlanName ?? '-'}</p>
                  <div className="mt-2 max-w-sm">
                    <Select
                      value={trip.routePlanId ?? '__none__'}
                      onValueChange={onAssignRoute}
                      disabled={assigningRoute}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign route plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No route plan</SelectItem>
                        {routePlans.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">Start Odometer</p>
                  <p className="font-medium">
                    {typeof trip.startOdometerKm === 'number' ? trip.startOdometerKm : '-'}
                  </p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-sm text-muted-foreground">End Odometer</p>
                  <p className="font-medium">
                    {typeof trip.endOdometerKm === 'number' ? trip.endOdometerKm : '-'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Trip not found.</p>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {timeline.map((item) => (
                  <div key={item.label} className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crew</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingCrew ? <p>Loading crew...</p> : null}
                {!loadingCrew && crew.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No crew assigned.</p>
                ) : null}
                {crew.map((member) => (
                  <div key={member.employeeId} className="rounded border p-3">
                    <p className="font-medium">{member.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.role} • assigned {formatDateTime(member.assignedAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Event odometer (km)"
                    value={eventOdometerKm}
                    onChange={(event) => setEventOdometerKm(event.target.value)}
                    type="number"
                    min={0}
                  />
                  <Input
                    placeholder="Location label"
                    value={eventLocationLabel}
                    onChange={(event) => setEventLocationLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Latitude"
                    value={eventLatitude}
                    onChange={(event) => setEventLatitude(event.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder="Longitude"
                    value={eventLongitude}
                    onChange={(event) => setEventLongitude(event.target.value)}
                    type="number"
                  />
                </div>
                <Textarea
                  placeholder="Event note (optional)"
                  value={eventNote}
                  onChange={(event) => setEventNote(event.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!trip || trip.status !== 1 || creatingCheckIn || creatingCheckOut}
                    onClick={() => onRecordCheckEvent('checkIn')}
                  >
                    Record Check-in
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!trip || trip.status !== 1 || creatingCheckIn || creatingCheckOut}
                    onClick={() => onRecordCheckEvent('checkOut')}
                  >
                    Record Check-out
                  </Button>
                </div>
                {loadingEvents ? <p>Loading events...</p> : null}
                {!loadingEvents && events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-in/check-out events yet.</p>
                ) : null}
                {events.map((event) => (
                  <div key={event.id} className="rounded border p-3">
                    <p className="font-medium">{eventTypeLabel(event.eventType)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(event.occurredAt)}
                      {event.locationLabel ? ` • ${event.locationLabel}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Odometer: {typeof event.odometerKm === 'number' ? event.odometerKm : '-'} |
                      By: {event.createdByName ?? event.createdBy ?? '-'}
                    </p>
                    {event.note ? <p className="text-sm mt-1">{event.note}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Status & Telemetry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded border p-3 text-sm">
                  <p>
                    Latest telemetry:{' '}
                    {latestTelemetry
                      ? formatDateTime(latestTelemetry.sampledAt)
                      : 'No telemetry yet'}
                  </p>
                  <p>
                    Speed:{' '}
                    {typeof latestTelemetry?.speedKph === 'number'
                      ? `${latestTelemetry.speedKph} km/h`
                      : '-'}{' '}
                    | Overspeed: {isOverspeeding ? `Yes (> ${overspeedThreshold} km/h)` : 'No'} |
                    Possible idle: {likelyIdle ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <Select value={statusType} onValueChange={setStatusType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">En Route</SelectItem>
                      <SelectItem value="1">At Pickup</SelectItem>
                      <SelectItem value="2">At Dropoff</SelectItem>
                      <SelectItem value="3">Delayed</SelectItem>
                      <SelectItem value="4">Stopped</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Status location"
                    value={statusLocationLabel}
                    onChange={(event) => setStatusLocationLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Status note"
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  disabled={!trip || trip.status !== 1 || recordingStatus}
                  onClick={onRecordStatus}
                >
                  Record Trip Status
                </Button>

                <div className="grid gap-2 md:grid-cols-4">
                  <Input
                    placeholder="Latitude"
                    value={telemetryLatitude}
                    onChange={(event) => setTelemetryLatitude(event.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder="Longitude"
                    value={telemetryLongitude}
                    onChange={(event) => setTelemetryLongitude(event.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder="Speed (km/h)"
                    value={telemetrySpeedKph}
                    onChange={(event) => setTelemetrySpeedKph(event.target.value)}
                    type="number"
                    min={0}
                  />
                  <Input
                    placeholder="Source/note"
                    value={telemetryNote}
                    onChange={(event) => setTelemetryNote(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  disabled={!trip || trip.status !== 1 || recordingTelemetry}
                  onClick={onRecordTelemetry}
                >
                  Record Telemetry
                </Button>

                {loadingStatuses ? (
                  <p className="text-sm text-muted-foreground">Loading status updates...</p>
                ) : null}
                {statuses.slice(0, 6).map((status) => (
                  <div key={status.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">
                      {status.statusType === 0
                        ? 'En Route'
                        : status.statusType === 1
                          ? 'At Pickup'
                          : status.statusType === 2
                            ? 'At Dropoff'
                            : status.statusType === 3
                              ? 'Delayed'
                              : 'Stopped'}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDateTime(status.occurredAt)}
                      {status.locationLabel ? ` • ${status.locationLabel}` : ''}
                    </p>
                  </div>
                ))}

                {loadingTelemetry ? (
                  <p className="text-sm text-muted-foreground">Loading telemetry...</p>
                ) : null}
                {telemetry.slice(0, 6).map((point) => (
                  <div key={point.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{formatDateTime(point.sampledAt)}</p>
                    <p className="text-muted-foreground">
                      {point.latitude}, {point.longitude} • Speed:{' '}
                      {typeof point.speedKph === 'number' ? `${point.speedKph} km/h` : '-'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
