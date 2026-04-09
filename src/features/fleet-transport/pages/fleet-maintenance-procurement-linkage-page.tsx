import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListFleetLowStockProcurementCandidatesQuery,
  useRunFleetLowStockAlertJobMutation,
} from '../api/fleet-transport.api';

export function FleetMaintenanceProcurementLinkagePage() {
  const [procurementLimit, setProcurementLimit] = useState('100');
  const [replenishMultiplier, setReplenishMultiplier] = useState('1');
  const { data: procurementCandidates, refetch: refetchProcCandidates } =
    useListFleetLowStockProcurementCandidatesQuery({
      limit: procurementLimit.trim() ? Number(procurementLimit) : 100,
      replenishMultiplier: replenishMultiplier.trim() ? Number(replenishMultiplier) : 1,
    });
  const [runLowStockJob, { isLoading: runningLowStockJob }] = useRunFleetLowStockAlertJobMutation();

  const onRunLowStock = async () => {
    try {
      const result = await runLowStockJob(undefined).unwrap();
      toast.success(
        `Low-stock hook done. Parts ${result.lowStockParts}, recipients ${result.recipients}, email sent ${result.emailSent}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run low-stock hook');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Procurement Linkage</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={procurementLimit}
                onChange={(event) => setProcurementLimit(event.target.value)}
                placeholder="Candidate limit"
              />
              <Input
                type="number"
                min={1}
                max={5}
                value={replenishMultiplier}
                onChange={(event) => setReplenishMultiplier(event.target.value)}
                placeholder="Replenish multiplier"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchProcCandidates()}>
                  Refresh candidates
                </Button>
                <Button variant="outline" onClick={onRunLowStock} disabled={runningLowStockJob}>
                  Run low-stock hook
                </Button>
                <Button asChild variant="outline">
                  <Link to="/fleet-transport/maintenance/procurement/traceability">
                    Traceability
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/fleet-transport/maintenance/procurement/reorder">Run Reorder</Link>
                </Button>
                <Button asChild>
                  <Link to="/procurement/demands/fleet-low-stock">Continue in Procurement</Link>
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Suggested candidates: {procurementCandidates?.summary.totalCandidates ?? 0} | Total
              suggested amount:{' '}
              {(procurementCandidates?.summary.totalSuggestedAmountPsw ?? 0).toLocaleString()}
            </p>
            {(procurementCandidates?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No low-stock procurement candidates.</p>
            ) : null}
            {procurementCandidates?.data.slice(0, 20).map((item) => (
              <div key={item.partId} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {item.sku} - {item.name}
                </p>
                <p className="text-muted-foreground">
                  Qty on hand: {item.qtyOnHand} {item.unit} | Reorder: {item.reorderLevel} |
                  Suggested qty: {item.suggestedQty}
                </p>
                <p className="text-muted-foreground">
                  Avg unit cost: {item.averageUnitCostPsw.toLocaleString()} | Suggested amount:{' '}
                  {item.suggestedAmountPsw.toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
