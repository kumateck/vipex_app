import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Textarea } from '@/components/ui/textarea';
import {
  useListFleetDowntimeRcaWorkflowsQuery,
  useUpdateFleetDowntimeRcaWorkflowMutation,
} from '../api/fleet-transport.api';

export function FleetMaintenanceDowntimeWorkflowEditPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = params.id ?? '';

  const { data: rows = [] } = useListFleetDowntimeRcaWorkflowsQuery();
  const item = rows.find((row) => row.id === id);

  const [reasonCategory, setReasonCategory] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState('0');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('0');

  useEffect(() => {
    if (!item) return;
    setReasonCategory(item.workflow.reasonCategory ?? '');
    setLifecycleStatus(String(item.workflow.lifecycleStatus));
    setRootCause(item.workflow.rootCause ?? '');
    setCorrectiveAction(item.workflow.correctiveAction ?? '');
    setEscalationLevel(String(item.workflow.escalationLevel));
  }, [item]);

  const [updateWorkflow, { isLoading }] = useUpdateFleetDowntimeRcaWorkflowMutation();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) {
      toast.error('Downtime id is required');
      return;
    }
    try {
      await updateWorkflow({
        id,
        body: {
          reasonCategory: reasonCategory.trim() || null,
          lifecycleStatus: lifecycleStatus.trim() ? Number(lifecycleStatus) : null,
          rootCause: rootCause.trim() || null,
          correctiveAction: correctiveAction.trim() || null,
          escalationLevel: escalationLevel.trim() ? Number(escalationLevel) : null,
        },
      }).unwrap();
      toast.success('Downtime workflow updated');
      navigate('/fleet-transport/maintenance/downtime/workflows');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update downtime workflow');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Edit Downtime RCA Workflow</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/downtime/workflows">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!item ? (
              <p className="text-sm text-muted-foreground">Downtime event not found.</p>
            ) : null}
            {item ? (
              <form className="grid gap-3" onSubmit={onSubmit}>
                <Input value={item.reason} disabled />
                <Input value={item.vehiclePlateNumber ?? item.vehicleId} disabled />
                <Input
                  value={reasonCategory}
                  onChange={(event) => setReasonCategory(event.target.value)}
                  placeholder="Reason category"
                />
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={lifecycleStatus}
                  onChange={(event) => setLifecycleStatus(event.target.value)}
                  placeholder="Lifecycle status"
                />
                <Textarea
                  value={rootCause}
                  onChange={(event) => setRootCause(event.target.value)}
                  placeholder="Root cause"
                />
                <Textarea
                  value={correctiveAction}
                  onChange={(event) => setCorrectiveAction(event.target.value)}
                  placeholder="Corrective action"
                />
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={escalationLevel}
                  onChange={(event) => setEscalationLevel(event.target.value)}
                  placeholder="Escalation level"
                />
                <Button type="submit" disabled={isLoading}>
                  Save workflow
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
