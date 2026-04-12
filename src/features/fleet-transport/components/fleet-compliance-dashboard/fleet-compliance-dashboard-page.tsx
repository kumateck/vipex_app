import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches';
import { downloadCsv } from '@/features/dashboard/utils/export-csv';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useGetFleetComplianceDashboardQuery,
  useRunFleetComplianceAlertJobMutation,
  useRunFleetVehicleLifecycleAutomationJobMutation,
} from '../../api/fleet-transport.api';

function toStatusLabel(value: string) {
  if (value === 'expired') return 'Expired';
  if (value === 'due_7') return 'Due in 7 days';
  if (value === 'due_30') return 'Due in 30 days';
  if (value === 'due_60') return 'Due in 60 days';
  return 'All';
}

export function FleetComplianceDashboardPage() {
  const [branchId, setBranchId] = useState('__all__');
  const [status, setStatus] = useState<'all' | 'expired' | 'due_7' | 'due_30' | 'due_60'>('all');
  const [horizonDays, setHorizonDays] = useState('60');
  const [limit, setLimit] = useState('200');

  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const query = useMemo(
    () => ({
      branchId: branchId === '__all__' ? undefined : branchId,
      status,
      horizonDays: horizonDays.trim() ? Number(horizonDays) : 60,
      limit: limit.trim() ? Number(limit) : 200,
    }),
    [branchId, status, horizonDays, limit],
  );
  const { data, isLoading, refetch } = useGetFleetComplianceDashboardQuery(query);
  const [runAlertJob, { isLoading: runningJob }] = useRunFleetComplianceAlertJobMutation();
  const [runLifecycleJob, { isLoading: runningLifecycleJob }] =
    useRunFleetVehicleLifecycleAutomationJobMutation();

  const exportRows = useMemo(
    () =>
      (data?.data ?? []).map((row) => ({
        type: row.kind,
        alertType: row.alertType,
        label: row.label,
        status: row.status,
        severity: row.severity,
        dueAt: row.dueAt,
        daysUntilDue: row.daysUntilDue,
        branchName: row.branchName ?? '',
        plateNumber: row.plateNumber ?? '',
        model: row.model ?? '',
        employeeNumber: row.employeeNumber ?? '',
        employeeName: row.employeeName ?? '',
      })),
    [data?.data],
  );

  const onExportCsv = () => {
    downloadCsv(
      `fleet-compliance-dashboard-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Type',
        'Alert Type',
        'Label',
        'Status',
        'Severity',
        'Due At',
        'Days Until Due',
        'Branch',
        'Vehicle Plate',
        'Vehicle Model',
        'Employee Number',
        'Employee Name',
      ],
      exportRows.map((row) => [
        row.type,
        row.alertType,
        row.label,
        row.status,
        row.severity,
        row.dueAt,
        String(row.daysUntilDue),
        row.branchName,
        row.plateNumber,
        row.model,
        row.employeeNumber,
        row.employeeName,
      ]),
    );
  };

  const onRunAlertJob = async () => {
    try {
      const result = await runAlertJob({
        horizonDays: horizonDays.trim() ? Number(horizonDays) : 60,
      }).unwrap();
      toast.success(
        `Alert job done. Recipients ${result.recipients}, in-app ${result.inAppCreated}, email sent ${result.emailSent}, email failed ${result.emailFailed}.`,
      );
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run compliance alert job');
    }
  };

  const onRunLifecycleJob = async () => {
    try {
      const result = await runLifecycleJob({ limit: 200 }).unwrap();
      toast.success(
        `Lifecycle automation done. Scanned ${result.scanned}, moved maintenance ${result.movedToMaintenance}, moved retired ${result.movedToRetired}.`,
      );
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run lifecycle automation');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compliance & Risk Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="due_7">Due in 7 days</SelectItem>
                <SelectItem value="due_30">Due in 30 days</SelectItem>
                <SelectItem value="due_60">Due in 60 days</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              max={365}
              value={horizonDays}
              onChange={(event) => setHorizonDays(event.target.value)}
              placeholder="Horizon days"
            />

            <Input
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={onExportCsv}
                disabled={(data?.data.length ?? 0) === 0}
              >
                Export CSV
              </Button>
            </div>

            <div>
              <Button onClick={onRunAlertJob} disabled={runningJob}>
                Run Daily Alert Hook
              </Button>
            </div>
            <div>
              <Button variant="outline" onClick={onRunLifecycleJob} disabled={runningLifecycleJob}>
                Run Lifecycle Automation Hook
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? <p>Loading dashboard...</p> : null}
            <p>Total: {data?.summary.total ?? 0}</p>
            <p>Expired: {data?.summary.expired ?? 0}</p>
            <p>Due in 7 days: {data?.summary.dueIn7Days ?? 0}</p>
            <p>Due in 30 days: {data?.summary.dueIn30Days ?? 0}</p>
            <p>Due in 60 days: {data?.summary.dueIn60Days ?? 0}</p>
            <p>Vehicle alerts: {data?.summary.vehicleAlerts ?? 0}</p>
            <p>Driver alerts: {data?.summary.driverAlerts ?? 0}</p>
            <p>Open incidents: {data?.summary.openIncidents ?? 0}</p>
            <p>Critical open incidents: {data?.summary.criticalOpenIncidents ?? 0}</p>
            <p>Open violations: {data?.summary.openViolations ?? 0}</p>
            <p>Open accidents: {data?.summary.openAccidents ?? 0}</p>
            <p>Revoked policies: {data?.summary.revokedPolicies ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No compliance alerts for this filter.</p>
            ) : null}
            {data?.data.map((alert) => (
              <div key={alert.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {alert.kind === 'vehicle'
                    ? `${alert.plateNumber ?? alert.vehicleId ?? ''} - ${alert.label}`
                    : `${alert.employeeNumber ?? ''} ${alert.employeeName ?? ''} - ${alert.label}`}
                </p>
                <p className="text-muted-foreground">
                  Branch: {alert.branchName ?? '-'} | Status: {toStatusLabel(alert.status)} |
                  Severity: {alert.severity}
                </p>
                <p className="text-muted-foreground">
                  Due: {new Date(alert.dueAt).toLocaleString()} | Days until due:{' '}
                  {alert.daysUntilDue}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
