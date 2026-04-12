import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCreateProcurementDemandsFromFleetLowStockMutation } from '../../api/procurement.api';

export function ProcurementDemandsFleetLowStockPage() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState('100');
  const [replenishMultiplier, setReplenishMultiplier] = useState('1');
  const [usePolicyRules, setUsePolicyRules] = useState(true);
  const [createFromFleetLowStock, { isLoading }] =
    useCreateProcurementDemandsFromFleetLowStockMutation();

  const onCreateDemands = async () => {
    try {
      const result = await createFromFleetLowStock({
        limit: limit.trim() ? Number(limit) : 100,
        replenishMultiplier: replenishMultiplier.trim() ? Number(replenishMultiplier) : 1,
        usePolicyRules,
      }).unwrap();
      toast.success(
        `Fleet low-stock intake done. Candidates ${result.candidates}, created ${result.created}, deduped ${result.deduped}.`,
      );
      navigate('/procurement/demands');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create demands');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Fleet Low-Stock Intake</CardTitle>
            <Button asChild variant="outline">
              <Link to="/procurement/demands">Back to demands</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This creates procurement demands from fleet maintenance low-stock candidates.
            </p>
            <div className="flex items-center justify-between rounded border p-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={usePolicyRules}
                  onChange={(event) => setUsePolicyRules(event.target.checked)}
                />
                Apply branch/global fleet procurement policy rules
              </label>
              <Button asChild variant="outline" size="sm">
                <Link to="/procurement/fleet-policies">Manage policy rules</Link>
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
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
                <Button onClick={onCreateDemands} disabled={isLoading}>
                  Create demands
                </Button>
                <Button variant="outline" onClick={() => navigate('/procurement/demands')}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
