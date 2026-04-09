import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetFleetMaintenanceProcurementTraceabilityQuery } from '../api/fleet-transport.api';

function statusLabel(value: number | null) {
  if (value === null || value === undefined) return '-';
  if (value === 0) return 'Open';
  if (value === 1) return 'Approved';
  if (value === 2) return 'Rejected';
  if (value === 3) return 'Converted';
  return String(value);
}

export function FleetMaintenanceProcurementTraceabilityPage() {
  const [branchId, setBranchId] = useState('');
  const [limit, setLimit] = useState('100');

  const { data, isLoading, refetch } = useGetFleetMaintenanceProcurementTraceabilityQuery({
    branchId: branchId.trim() || undefined,
    limit: limit.trim() ? Number(limit) : 100,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Maintenance Procurement Traceability</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/procurement/reorder">Run Reorder Job</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              placeholder="Branch id (optional)"
            />
            <Input
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading traceability...</p> : null}
            <p>Total parts: {data?.summary.totalParts ?? 0}</p>
            <p>Below reorder: {data?.summary.belowReorder ?? 0}</p>
            <p>Demand created: {data?.summary.demandCreated ?? 0}</p>
            <p>Demand approved: {data?.summary.demandApproved ?? 0}</p>
            <p>PO raised: {data?.summary.poRaised ?? 0}</p>
            <p>Fully received: {data?.summary.fullyReceived ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traceability Lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">No traceability lines found.</p>
            ) : null}
            {data?.data.map((row) => (
              <div key={row.partId} className="rounded border p-3">
                <p className="font-medium">
                  {row.sku} - {row.name}
                </p>
                <p className="text-muted-foreground">
                  Qty on hand: {row.qtyOnHand} {row.unit} | Reorder: {row.reorderLevel} | Receipt
                  gap: {row.receiptGapQty}
                </p>
                <p className="text-muted-foreground">
                  Demand: {row.latestDemandNo ?? '-'} ({statusLabel(row.latestDemandStatus)}) | PO:{' '}
                  {row.latestPoNo ?? '-'}
                </p>
                <p className="text-muted-foreground">
                  Ordered: {row.orderedQty} | Received: {row.receivedQty} | Issued: {row.issuedQty}
                </p>
                <p className="text-muted-foreground">
                  Approval gate: {row.approvalGatePassed ? 'Passed' : 'Blocked'}
                  {row.blockedReason ? ` (${row.blockedReason})` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
