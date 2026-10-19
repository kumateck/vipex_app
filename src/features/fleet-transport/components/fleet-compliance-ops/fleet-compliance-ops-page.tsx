import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetOpsQueueQuery,
  useListFleetComplianceIncidentsQuery,
  useListFleetPolicyAcknowledgmentsQuery,
  useRunFleetAutomationOrchestrationJobMutation,
  useRunFleetComplianceEscalationJobMutation,
  useRunFleetPolicyReackReminderJobMutation,
  useTransitionFleetComplianceIncidentCaseMutation,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

function incidentTypeLabel(value: number) {
  if (value === 0) return 'Violation';
  if (value === 1) return 'Accident';
  return 'Unknown';
}

function severityLabel(value: number) {
  if (value === 0) return 'Low';
  if (value === 1) return 'Medium';
  if (value === 2) return 'High';
  if (value === 3) return 'Critical';
  return 'Unknown';
}

export function FleetComplianceOpsPage() {
  const [reackDays, setReackDays] = useState('365');
  const [incidentEscalateDays, setIncidentEscalateDays] = useState('3');
  const [dueWithinDays, setDueWithinDays] = useState('0');
  const [caseStatus, setCaseStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const {
    data: incidentsRes,
    isLoading: loadingIncidents,
    refetch: refetchIncidents,
  } = useListFleetComplianceIncidentsQuery({
    pageSize: 50,
    filters: {
      caseStatus: caseStatus === 'all' ? undefined : caseStatus,
    },
  });
  const { data: acknowledgmentsRes, isLoading: loadingAcks } =
    useListFleetPolicyAcknowledgmentsQuery({ pageSize: 50 });
  const {
    data: opsQueue,
    isLoading: loadingOpsQueue,
    refetch: refetchOpsQueue,
  } = useGetFleetOpsQueueQuery({
    horizonDays: 30,
    incidentLimit: 20,
    workOrderLimit: 20,
    downtimeLimit: 20,
    lowStockLimit: 20,
    policyReackAfterDays: reackDays.trim() ? Number(reackDays) : 365,
  });
  const [transitionIncidentCase, { isLoading: updatingIncident }] =
    useTransitionFleetComplianceIncidentCaseMutation();
  const [runReackJob, { isLoading: runningReack }] = useRunFleetPolicyReackReminderJobMutation();
  const [runEscalationJob, { isLoading: runningEscalation }] =
    useRunFleetComplianceEscalationJobMutation();
  const [runAutomation, { isLoading: runningAutomation }] =
    useRunFleetAutomationOrchestrationJobMutation();

  const onResolveIncident = async (id: string) => {
    try {
      await transitionIncidentCase({
        id,
        action: 'resolve',
        resolvedAt: new Date().toISOString(),
        actionTaken: 'Resolved by compliance operations',
      }).unwrap();
      toast.success('Incident marked as resolved');
      await refetchIncidents();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to resolve incident');
    }
  };

  const onReopenIncident = async (id: string) => {
    try {
      await transitionIncidentCase({
        id,
        action: 'reopen',
      }).unwrap();
      toast.success('Incident reopened');
      await refetchIncidents();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to reopen incident');
    }
  };

  const onRunReack = async () => {
    try {
      const result = await runReackJob({
        remindAfterDays: reackDays.trim() ? Number(reackDays) : 365,
      }).unwrap();
      toast.success(
        `Re-ack reminder done. Candidates ${result.candidates}, recipients ${result.recipients}, email sent ${result.emailSent}.`,
      );
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to run re-ack reminder');
    }
  };

  const onRunEscalation = async () => {
    try {
      const result = await runEscalationJob({
        incidentEscalateAfterDays: incidentEscalateDays.trim() ? Number(incidentEscalateDays) : 3,
      }).unwrap();
      toast.success(
        `Escalation run complete. Incident escalations ${result.incidentEscalations}, compliance escalations ${result.complianceEscalations}.`,
      );
      await refetchOpsQueue();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to run escalation workflow');
    }
  };

  const onRunAutomation = async () => {
    try {
      const result = await runAutomation({
        dueWithinDays: dueWithinDays.trim() ? Number(dueWithinDays) : 0,
        incidentEscalateAfterDays: incidentEscalateDays.trim() ? Number(incidentEscalateDays) : 3,
      }).unwrap();
      toast.success(
        `Automation done. Vehicle updates ${result.lifecycle.updatedVehicleIds.length}, work orders ${result.maintenance.autoWorkOrdersCreated}, procurement demands ${result.maintenance.procurementDemandsCreated}.`,
      );
      await Promise.all([refetchIncidents(), refetchOpsQueue()]);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to run full automation');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/fleet-transport/compliance/ops/incidents/new">Record Incident</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/compliance/ops/policy-acks/new">
                  Policy Acknowledgment
                </Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={reackDays}
                onChange={(event) => setReackDays(event.target.value)}
                placeholder="Re-ack after days"
              />
              <Button variant="outline" onClick={onRunReack} disabled={runningReack}>
                Run Re-Ack Reminder Hook
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                type="number"
                min={1}
                value={incidentEscalateDays}
                onChange={(event) => setIncidentEscalateDays(event.target.value)}
                placeholder="Incident escalation days"
              />
              <Input
                type="number"
                min={0}
                value={dueWithinDays}
                onChange={(event) => setDueWithinDays(event.target.value)}
                placeholder="Maintenance due window (days)"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={onRunEscalation} disabled={runningEscalation}>
                  Run Escalation Workflow
                </Button>
                <Button onClick={onRunAutomation} disabled={runningAutomation}>
                  Run Full Automation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingOpsQueue ? <p>Loading ops queue...</p> : null}
            {!loadingOpsQueue ? (
              <p>
                Immediate actions: {opsQueue?.summary.needsImmediateAction ?? 0} | Critical
                incidents: {opsQueue?.summary.criticalOpenIncidents ?? 0} | Expired compliance:{' '}
                {opsQueue?.summary.complianceExpired ?? 0} | Low-stock:{' '}
                {opsQueue?.summary.lowStockCandidates ?? 0}
              </p>
            ) : null}
            {(opsQueue?.queues.complianceAlerts.length ?? 0) > 0 ? (
              <p className="text-muted-foreground">
                Top compliance item: {opsQueue?.queues.complianceAlerts[0]?.label ?? '-'}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={caseStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setCaseStatus('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={caseStatus === 'open' ? 'default' : 'outline'}
                onClick={() => setCaseStatus('open')}
              >
                Open
              </Button>
              <Button
                size="sm"
                variant={caseStatus === 'resolved' ? 'default' : 'outline'}
                onClick={() => setCaseStatus('resolved')}
              >
                Resolved
              </Button>
            </div>
            {loadingIncidents ? <p>Loading incidents...</p> : null}
            {(incidentsRes?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No incidents recorded.</p>
            ) : null}
            {incidentsRes?.data.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="font-medium">
                  {incidentTypeLabel(item.incidentType)} • {severityLabel(item.severity)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Case: {item.caseStatus}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(item.occurredAt)} • {item.locationLabel ?? '-'}
                </p>
                <p>{item.description}</p>
                {item.actionTaken ? (
                  <p className="text-muted-foreground">Action: {item.actionTaken}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingIncident || item.caseStatus === 'resolved'}
                    onClick={() => onResolveIncident(item.id)}
                  >
                    {item.caseStatus === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updatingIncident || item.caseStatus !== 'resolved'}
                    onClick={() => onReopenIncident(item.id)}
                  >
                    Reopen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Acknowledgments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingAcks ? <p>Loading acknowledgments...</p> : null}
            {(acknowledgmentsRes?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No acknowledgments yet.</p>
            ) : null}
            {acknowledgmentsRes?.data.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="font-medium">
                  {item.policyCode} {item.policyVersion} •{' '}
                  {item.status === 0 ? 'Acknowledged' : 'Revoked'}
                </p>
                <p className="text-muted-foreground">
                  {item.employeeName ?? item.userName ?? item.employeeId ?? item.userId ?? '-'} •{' '}
                  {formatDateTime(item.acknowledgedAt)}
                </p>
                {item.note ? <p>{item.note}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
