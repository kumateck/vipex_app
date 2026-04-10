import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useRunFleetMaintenanceReorderDemandJobMutation } from '../../api/fleet-transport.api';

export function FleetMaintenanceProcurementReorderRunPage() {
  const [dueWithinDays, setDueWithinDays] = useState('0');
  const [lowStockLimit, setLowStockLimit] = useState('200');
  const [replenishMultiplier, setReplenishMultiplier] = useState('1');
  const [lastRun, setLastRun] = useState<{
    lowStockCandidates: number;
    procurementDemandsCreated: number;
    procurementDemandIds: string[];
  } | null>(null);

  const [runReorder, { isLoading }] = useRunFleetMaintenanceReorderDemandJobMutation();

  const onRun = async () => {
    try {
      const result = await runReorder({
        dueWithinDays: dueWithinDays.trim() ? Number(dueWithinDays) : 0,
        lowStockLimit: lowStockLimit.trim() ? Number(lowStockLimit) : 200,
        replenishMultiplier: replenishMultiplier.trim() ? Number(replenishMultiplier) : 1,
      }).unwrap();
      setLastRun(result);
      toast.success(
        `Reorder run completed. Candidates ${result.lowStockCandidates}, demands created ${result.procurementDemandsCreated}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run reorder demand job');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Run Maintenance Reorder Job</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/procurement/traceability">Traceability</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min={0}
              max={60}
              value={dueWithinDays}
              onChange={(event) => setDueWithinDays(event.target.value)}
              placeholder="Due within days"
            />
            <Input
              type="number"
              min={1}
              max={1000}
              value={lowStockLimit}
              onChange={(event) => setLowStockLimit(event.target.value)}
              placeholder="Low stock scan limit"
            />
            <Input
              type="number"
              min={1}
              max={5}
              value={replenishMultiplier}
              onChange={(event) => setReplenishMultiplier(event.target.value)}
              placeholder="Replenish multiplier"
            />
            <Button onClick={onRun} disabled={isLoading}>
              Run reorder job
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Run Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {!lastRun ? <p className="text-muted-foreground">No run yet.</p> : null}
            {lastRun ? (
              <>
                <p>Low-stock candidates: {lastRun.lowStockCandidates}</p>
                <p>Procurement demands created: {lastRun.procurementDemandsCreated}</p>
                <p>Demand ids: {lastRun.procurementDemandIds.join(', ') || '-'}</p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
