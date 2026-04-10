import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetStockLotExpiryAlertsQuery,
  useRunStockLotExpirySweepMutation,
} from '@/features/inventory/api';

export function StockLotExpiryAlertsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [daysAhead, setDaysAhead] = useState(30);
  const [runSweep, { isLoading: sweeping }] = useRunStockLotExpirySweepMutation();

  const query = useMemo(
    () => ({
      companyId: companyId ?? '',
      daysAhead,
    }),
    [companyId, daysAhead],
  );
  const { data, isLoading, refetch } = useGetStockLotExpiryAlertsQuery(query, { skip: !companyId });

  const onSweep = async () => {
    if (!companyId) return;
    try {
      const result = await runSweep({ companyId }).unwrap();
      toast.success(`Expired ${result.expiredCount} lots`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sweep failed');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Lot Expiry Alerts</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/inventory/stock-lots">Stock Lots</Link>
              </Button>
              <Button onClick={onSweep} disabled={sweeping || !companyId}>
                Sweep Expired
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm" htmlFor="daysAhead">
                Days ahead
              </label>
              <input
                id="daysAhead"
                className="border rounded px-2 py-1 text-sm w-24"
                type="number"
                min={1}
                max={180}
                value={daysAhead}
                onChange={(event) =>
                  setDaysAhead(Math.max(1, Math.min(180, Number(event.target.value) || 30)))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="border rounded p-3">
                Near expiry lots: <strong>{data?.totals.nearExpiryCount ?? 0}</strong>
              </div>
              <div className="border rounded p-3">
                Expired lots: <strong>{data?.totals.expiredCount ?? 0}</strong>
              </div>
              <div className="border rounded p-3">
                At-risk qty: <strong>{data?.totals.atRiskQuantity ?? '0'}</strong>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading alerts...</TableCell>
                  </TableRow>
                ) : data?.rows.length ? (
                  data.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.batchNumber}</TableCell>
                      <TableCell>{row.productId}</TableCell>
                      <TableCell>{row.locationId}</TableCell>
                      <TableCell>
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{row.quantityOnHand}</TableCell>
                      <TableCell>{row.reservedQuantity}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No near-expiry lots.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
