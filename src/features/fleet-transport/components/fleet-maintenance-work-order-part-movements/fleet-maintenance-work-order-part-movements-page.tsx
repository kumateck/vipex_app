import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListFleetMaintenanceWorkOrderPartMovementsQuery } from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function movementTypeLabel(value: number) {
  if (value === 0) return 'IN';
  if (value === 1) return 'OUT';
  if (value === 2) return 'ADJUSTMENT';
  return `Unknown (${value})`;
}

export function FleetMaintenanceWorkOrderPartMovementsPage() {
  const [workOrderId, setWorkOrderId] = useState('');
  const [limit, setLimit] = useState('200');

  const {
    data = [],
    isLoading,
    error,
  } = useListFleetMaintenanceWorkOrderPartMovementsQuery(
    {
      id: workOrderId.trim(),
      limit: limit.trim() ? Number(limit) : 200,
    },
    { skip: !workOrderId.trim() },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Work Order Part Movements</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/work-orders">Back to Work Orders</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              value={workOrderId}
              onChange={(event) => setWorkOrderId(event.target.value)}
              placeholder="Work order id"
            />
            <Input
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Limit"
            />
            <p className="text-sm text-muted-foreground">
              Enter a work order id to view parts issue/receive movement history.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!workOrderId.trim() ? (
              <p className="text-muted-foreground">
                Provide a work order id to load movement history.
              </p>
            ) : null}
            {isLoading ? (
              <p className="text-muted-foreground">Loading movement history...</p>
            ) : null}
            {error ? <p className="text-destructive">Failed to load movement history.</p> : null}
            {workOrderId.trim() && !isLoading && !error && data.length === 0 ? (
              <p className="text-muted-foreground">
                No movement history found for this work order.
              </p>
            ) : null}
            {data.map((row) => (
              <div key={row.id} className="rounded border p-3">
                <p className="font-medium">
                  {row.partSku} - {row.partName}
                </p>
                <p className="text-muted-foreground">
                  Type: {movementTypeLabel(row.movementType)} | Qty: {row.quantity} {row.partUnit} |
                  Unit cost: {row.unitCostPsw.toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  Moved at: {formatDateTime(row.movedAt)} | By:{' '}
                  {row.movedByName ?? row.movedBy ?? '-'}
                </p>
                <p className="text-muted-foreground">Note: {row.note ?? '-'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
