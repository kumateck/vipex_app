import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  useGetFleetDispatchLoadCandidatesQuery,
  useListFleetTripLoadMatchesQuery,
  useListFleetTripsQuery,
  useUpdateFleetTripLoadMatchStatusMutation,
} from '../api/fleet-transport.api';

function loadStatusLabel(value: number) {
  if (value === 0) return 'Assigned';
  if (value === 1) return 'Loaded';
  if (value === 2) return 'Unloaded';
  if (value === 3) return 'Cancelled';
  return 'Unknown';
}

export function FleetDispatchLoadMatchingPage() {
  const [tripId, setTripId] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [search, setSearch] = useState('');

  const { data: trips } = useListFleetTripsQuery({ pageSize: 200 });
  const { data: matches = [], isLoading } = useListFleetTripLoadMatchesQuery(
    { id: tripId },
    { skip: !tripId },
  );
  const [updateStatus, { isLoading: updating }] = useUpdateFleetTripLoadMatchStatusMutation();
  const { data: candidates, isLoading: loadingCandidates } = useGetFleetDispatchLoadCandidatesQuery(
    { tripId, search: search.trim() || undefined, limit: 100 },
    { skip: !tripId },
  );

  const summary = useMemo(
    () => ({
      assigned: matches.filter((row) => row.status === 0).length,
      loaded: matches.filter((row) => row.status === 1).length,
      unloaded: matches.filter((row) => row.status === 2).length,
      cancelled: matches.filter((row) => row.status === 3).length,
    }),
    [matches],
  );

  const visibleMatches = useMemo(() => {
    if (statusFilter === '__all__') return matches;
    return matches.filter((row) => String(row.status) === statusFilter);
  }, [matches, statusFilter]);

  const selectedTrip = useMemo(
    () => trips?.data.find((trip) => trip.id === tripId) ?? null,
    [trips?.data, tripId],
  );

  const onMark = async (loadMatchId: string, status: number) => {
    try {
      await updateStatus({ loadMatchId, status }).unwrap();
      toast.success('Load status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update load status');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Load Matching Queue</CardTitle>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/load-matching/new">Assign Load</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/fleet-transport/dispatch/load-matching/audit">Load Audit Trail</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="0">Assigned</SelectItem>
                <SelectItem value="1">Loaded</SelectItem>
                <SelectItem value="2">Unloaded</SelectItem>
                <SelectItem value="3">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="rounded border p-3 text-sm">
              <p className="text-muted-foreground">Assigned</p>
              <p className="text-lg font-semibold">{summary.assigned}</p>
            </div>
            <div className="rounded border p-3 text-sm">
              <p className="text-muted-foreground">Loaded / Unloaded</p>
              <p className="text-lg font-semibold">
                {summary.loaded} / {summary.unloaded}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidate Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!tripId ? (
              <p className="text-muted-foreground">Select a trip to load candidates.</p>
            ) : null}
            {tripId ? (
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by booking/tracking"
              />
            ) : null}
            {loadingCandidates ? (
              <p className="text-muted-foreground">Loading candidates...</p>
            ) : null}
            {tripId && !loadingCandidates && (candidates?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No candidates found for this trip.</p>
            ) : null}
            {candidates?.data.slice(0, 20).map((row) => (
              <div key={row.parcelId} className="rounded border p-3">
                <p className="font-medium">
                  {row.trackingCode} | {row.bookingCode}
                </p>
                <p className="text-muted-foreground">
                  Source: {row.sourceId ?? '-'} | Destination: {row.destinationId ?? '-'} | Route
                  aligned: {row.routeAligned === null ? '-' : row.routeAligned ? 'Yes' : 'No'}
                </p>
                <p className="text-muted-foreground">
                  Active trip: {row.activeTripId ?? '-'} | Blocked:{' '}
                  {row.assignmentBlockedReason ?? 'No'}
                </p>
                {row.assignedToAnotherTrip ? (
                  <Button size="sm" variant="outline" disabled>
                    Assigned Elsewhere
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to={`/fleet-transport/dispatch/load-matching/new?tripId=${encodeURIComponent(tripId)}&parcelId=${encodeURIComponent(row.parcelId)}`}
                    >
                      Open Assign Page
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip Load Rows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!tripId ? (
              <p className="text-muted-foreground">Select a trip to view load rows.</p>
            ) : null}
            {isLoading ? <p className="text-muted-foreground">Loading load rows...</p> : null}
            {tripId && !isLoading && visibleMatches.length === 0 ? (
              <p className="text-muted-foreground">No load rows for selected filter.</p>
            ) : null}
            {selectedTrip ? (
              <p className="text-muted-foreground">
                Trip: {selectedTrip.tripNo} | Vehicle{' '}
                {selectedTrip.vehiclePlateNumber ?? selectedTrip.vehicleId}
              </p>
            ) : null}
            {visibleMatches.map((match) => (
              <div key={match.id} className="rounded border p-3">
                <p className="font-medium">Parcel {match.trackingCode ?? match.parcelId}</p>
                <p className="text-muted-foreground">
                  Status: {loadStatusLabel(match.status)} | Matched at{' '}
                  {new Date(match.matchedAt).toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  Booking: {match.bookingCode ?? '-'} | Note: {match.note ?? '-'}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {match.status === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => onMark(match.id, 1)}
                    >
                      Mark Loaded
                    </Button>
                  ) : null}
                  {match.status === 1 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => onMark(match.id, 2)}
                    >
                      Mark Unloaded
                    </Button>
                  ) : null}
                  {match.status !== 2 && match.status !== 3 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => onMark(match.id, 3)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
