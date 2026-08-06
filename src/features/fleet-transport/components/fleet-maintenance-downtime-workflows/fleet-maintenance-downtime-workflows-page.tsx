import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListFleetDowntimeRcaWorkflowsQuery,
  useReopenFleetDowntimeEventMutation,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

function lifecycleLabel(value: number) {
  if (value === 0) return 'Detected';
  if (value === 1) return 'Investigating';
  if (value === 2) return 'Action Planned';
  if (value === 3) return 'Monitoring';
  if (value === 4) return 'Closed';
  if (value === 5) return 'Escalated/Reopened';
  return `Unknown (${value})`;
}

export function FleetMaintenanceDowntimeWorkflowsPage() {
  const { data: rows = [] } = useListFleetDowntimeRcaWorkflowsQuery();
  const [reopenDowntime, { isLoading: reopening }] = useReopenFleetDowntimeEventMutation();

  const onReopen = async (id: string) => {
    try {
      await reopenDowntime({ id }).unwrap();
      toast.success('Downtime event reopened');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reopen downtime event');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Downtime RCA Workflows</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime/new">Start Downtime</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No downtime workflows.</p>
            ) : null}
            {rows.map((row) => (
              <div key={row.id} className="rounded border p-3 space-y-1 text-sm">
                <p className="font-medium">
                  {row.reason} | {row.vehiclePlateNumber ?? row.vehicleId}
                </p>
                <p className="text-muted-foreground">
                  Started: {formatDateTime(row.startedAt)} | Ended: {formatDateTime(row.endedAt)}
                </p>
                <p className="text-muted-foreground">
                  Category: {row.workflow.reasonCategory ?? '-'} | Lifecycle:{' '}
                  {lifecycleLabel(row.workflow.lifecycleStatus)} | Escalation level:{' '}
                  {row.workflow.escalationLevel}
                </p>
                <p className="text-muted-foreground">
                  Reopened: {row.workflow.reopenedCount} | Last reopened:{' '}
                  {formatDateTime(row.workflow.lastReopenedAt)}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/fleet-transport/maintenance/downtime/workflows/${row.id}/edit`}>
                      Edit Workflow
                    </Link>
                  </Button>
                  {row.endedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reopening}
                      onClick={() => onReopen(row.id)}
                    >
                      Reopen
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
