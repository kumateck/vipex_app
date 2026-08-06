import { useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useListFleetMaintenancePartMovementsQuery,
  useListFleetMaintenancePartsQuery,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetMaintenanceStockMovementsPage() {
  const { data: partsRes } = useListFleetMaintenancePartsQuery({ pageSize: 100 });
  const parts = useMemo(() => partsRes?.data ?? [], [partsRes?.data]);
  const [partId, setPartId] = useState('');

  const { data: partMovementsRes, isLoading: loadingHistory } =
    useListFleetMaintenancePartMovementsQuery({ partId, pageSize: 20 }, { skip: !partId });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Movement History</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/parts/movements/new">Post movement</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger>
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.sku} - {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!partId ? (
              <p className="text-sm text-muted-foreground">Select a part to view history.</p>
            ) : null}
            {loadingHistory ? (
              <p className="text-sm text-muted-foreground">Loading movement history...</p>
            ) : null}
            {partId && !loadingHistory && (partMovementsRes?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No movement history yet.</p>
            ) : null}
            {partMovementsRes?.data.map((row) => (
              <div key={row.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {row.movementType === 0
                    ? 'Stock In'
                    : row.movementType === 1
                      ? 'Stock Out'
                      : 'Adjustment'}
                </p>
                <p className="text-muted-foreground">
                  Qty: {row.quantity} | Unit cost: {row.unitCostPsw.toLocaleString()} | At:{' '}
                  {formatDateTime(row.movedAt)}
                </p>
                <p className="text-muted-foreground">By: {row.movedByName ?? row.movedBy ?? '-'}</p>
                {row.note ? <p>{row.note}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
