import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useListFleetShiftRostersQuery,
  useUpdateFleetShiftRosterMutation,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function FleetShiftRostersPage() {
  const { data: rosters } = useListFleetShiftRostersQuery({ pageSize: 50 });
  const [updateRoster, { isLoading: updating }] = useUpdateFleetShiftRosterMutation();

  const onMarkStatus = async (id: string, status: number) => {
    try {
      await updateRoster({ id, status }).unwrap();
      toast.success(status === 1 ? 'Roster marked completed' : 'Roster cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update roster');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Shift Rosters</CardTitle>
            <Button asChild>
              <Link to="/fleet-transport/rosters/new">Create roster</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(rosters?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No roster records yet.</p>
            ) : null}
            {rosters?.data.map((row) => (
              <div key={row.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {row.employeeName} • {row.roleType === 0 ? 'Driver' : 'Crew'}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(row.shiftStartAt)} - {formatDateTime(row.shiftEndAt)}
                </p>
                <p className="text-muted-foreground">
                  Vehicle: {row.vehiclePlateNumber ?? row.vehicleId ?? '-'} | Status:{' '}
                  {row.status === 0 ? 'Planned' : row.status === 1 ? 'Completed' : 'Cancelled'}
                </p>
                {row.status === 0 ? (
                  <div className="mt-2 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/fleet-transport/rosters/edit/${row.id}`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => onMarkStatus(row.id, 1)}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => onMarkStatus(row.id, 2)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/fleet-transport/rosters/edit/${row.id}`}>View/Edit</Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
