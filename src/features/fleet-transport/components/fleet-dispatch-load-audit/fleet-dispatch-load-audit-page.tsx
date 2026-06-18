import { useState } from 'react';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListFleetTripLoadAuditTrailQuery,
  useListFleetTripsQuery,
} from '../../api/fleet-transport.api';

export function FleetDispatchLoadAuditPage() {
  const [tripId, setTripId] = useState('');
  const [limit, setLimit] = useState('200');

  const { data: trips } = useListFleetTripsQuery({ pageSize: 200 });
  const { data: rows = [], isLoading } = useListFleetTripLoadAuditTrailQuery(
    { id: tripId, limit: limit.trim() ? Number(limit) : 200 },
    { skip: !tripId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Load Matching Audit Trail</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/fleet-transport/dispatch/load-matching">Back to load matching</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <select
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              className="h-10 rounded border bg-background px-3 text-sm"
            >
              <option value="">Select trip</option>
              {trips?.data.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.tripNo} - {trip.vehiclePlateNumber ?? trip.vehicleId}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!tripId ? (
              <p className="text-muted-foreground">Select a trip to see load audit events.</p>
            ) : null}
            {isLoading ? <p className="text-muted-foreground">Loading audit trail...</p> : null}
            {tripId && !isLoading && rows.length === 0 ? (
              <p className="text-muted-foreground">
                No load matching audit entries found for this trip.
              </p>
            ) : null}
            {rows.map((row) => (
              <div key={row.id} className="rounded border p-3">
                <p className="font-medium">{row.action}</p>
                <p className="text-muted-foreground">
                  {formatDateTimeShared(row.createdAt)} |{' '}
                  {row.actorUserName ?? row.actorUserId ?? 'system'}
                </p>
                <p className="text-muted-foreground">{row.message ?? '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
