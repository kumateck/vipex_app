import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCloseFleetDowntimeEventMutation,
  useListFleetDowntimeEventsQuery,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function durationMinutes(startedAt: string, endedAt: string | null) {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return (end - start) / 60000;
}

export function FleetMaintenanceDowntimePage() {
  const { data: events = [] } = useListFleetDowntimeEventsQuery();
  const [closeDowntime, { isLoading: closingDowntime }] = useCloseFleetDowntimeEventMutation();

  const onCloseDowntime = async (id: string) => {
    try {
      await closeDowntime({ id }).unwrap();
      toast.success('Downtime closed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to close downtime');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Downtime Events</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime/new">Start Downtime</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime/workflows">RCA Workflows</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back to dashboard</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No downtime events.</p>
            ) : null}
            {events.map((event) => (
              <div key={event.id} className="rounded border p-3 space-y-1">
                <p className="font-medium">{event.reason}</p>
                <p className="text-sm text-muted-foreground">
                  Vehicle: {event.vehiclePlateNumber ?? event.vehicleId} | Started:{' '}
                  {formatDateTime(event.startedAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ended: {formatDateTime(event.endedAt)} | Duration(min):{' '}
                  {typeof durationMinutes(event.startedAt, event.endedAt) === 'number'
                    ? durationMinutes(event.startedAt, event.endedAt)?.toFixed(2)
                    : '-'}
                </p>
                {!event.endedAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCloseDowntime(event.id)}
                    disabled={closingDowntime}
                  >
                    Close downtime
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
