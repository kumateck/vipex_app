import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { downloadCsv } from '@/features/dashboard/utils/export-csv';
import { useGetFleetComplianceKpiTrendsQuery } from '../api/fleet-transport.api';

function fmt(value: number, digits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function FleetComplianceKpiPage() {
  const [windowDays, setWindowDays] = useState('180');
  const { data, isLoading, refetch } = useGetFleetComplianceKpiTrendsQuery({
    windowDays: windowDays.trim() ? Number(windowDays) : 180,
  });
  const exportRows = useMemo(
    () =>
      (data?.monthlyIncidents ?? []).map((row) => ({
        month: row.month,
        total: row.total,
        open: row.open,
        critical: row.critical,
        resolvedWithin48h: row.resolvedWithin48h,
        openRatePct: row.openRatePct,
        criticalRatePct: row.criticalRatePct,
        resolvedWithin48hPct: row.resolvedWithin48hPct,
      })),
    [data?.monthlyIncidents],
  );

  const onExportCsv = () => {
    downloadCsv(
      `fleet-compliance-kpi-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Month',
        'Total Incidents',
        'Open Incidents',
        'Critical Incidents',
        'Resolved <48h',
        'Open Rate %',
        'Critical Rate %',
        'Resolved <48h Rate %',
      ],
      exportRows.map((row) => [
        row.month,
        row.total,
        row.open,
        row.critical,
        row.resolvedWithin48h,
        row.openRatePct,
        row.criticalRatePct,
        row.resolvedWithin48hPct,
      ]),
    );
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compliance KPI Trends</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min={30}
              max={365}
              value={windowDays}
              onChange={(event) => setWindowDays(event.target.value)}
              placeholder="Window days"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onExportCsv}
              disabled={(data?.monthlyIncidents.length ?? 0) === 0}
            >
              Export CSV
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading KPI trends...</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Incidents in window: {data?.summary.incidentsInWindow ?? 0}</p>
            <p>Open incidents: {data?.summary.openIncidents ?? 0}</p>
            <p>Critical incidents: {data?.summary.criticalIncidents ?? 0}</p>
            <p>Policy acks in window: {data?.summary.policyAcksInWindow ?? 0}</p>
            <p>Pending policy acks: {data?.summary.pendingPolicyAcks ?? 0}</p>
            <p>Revoked policy acks: {data?.summary.revokedPolicyAcks ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Aging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>0-2 days: {data?.incidentAging.d0to2 ?? 0}</p>
            <p>3-7 days: {data?.incidentAging.d3to7 ?? 0}</p>
            <p>8-14 days: {data?.incidentAging.d8to14 ?? 0}</p>
            <p>15+ days: {data?.incidentAging.d15plus ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Incident Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.monthlyIncidents.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No incident trend records in selected window.</p>
            ) : null}
            {data?.monthlyIncidents.map((row) => (
              <div key={row.month} className="rounded border p-3">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">
                  Total: {row.total} | Open: {row.open} | Critical: {row.critical}
                </p>
                <p className="text-muted-foreground">
                  Open rate: {fmt(row.openRatePct)}% | Critical rate: {fmt(row.criticalRatePct)}% |
                  Closed &lt;48h: {fmt(row.resolvedWithin48hPct)}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Policy Acknowledgment Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.monthlyPolicyAcks.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No policy acknowledgment trend rows in selected window.
              </p>
            ) : null}
            {data?.monthlyPolicyAcks.map((row) => (
              <div key={row.month} className="rounded border p-3">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">
                  Total: {row.total} | Acknowledged: {row.acknowledged} | Pending: {row.pending} |
                  Revoked: {row.revoked}
                </p>
                <p className="text-muted-foreground">
                  Ack rate: {fmt(row.acknowledgmentRatePct)}% | Pending rate:{' '}
                  {fmt(row.pendingRatePct)}% | Revoked rate: {fmt(row.revokedRatePct)}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
