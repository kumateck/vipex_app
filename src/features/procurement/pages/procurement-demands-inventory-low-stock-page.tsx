import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateProcurementDemandsFromInventoryLowStockMutation } from '../api/procurement.api';

export function ProcurementDemandsInventoryLowStockPage() {
  const [rootLocationId, setRootLocationId] = useState('');
  const [targetMainStoreLocationId, setTargetMainStoreLocationId] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('200');
  const [runIntake, { isLoading }] = useCreateProcurementDemandsFromInventoryLowStockMutation();

  const onSubmit = async () => {
    try {
      const result = await runIntake({
        rootLocationId: rootLocationId.trim() || null,
        targetMainStoreLocationId: targetMainStoreLocationId.trim() || null,
        lowStockLimit: Number(lowStockLimit) || 200,
      }).unwrap();
      toast.success(
        `Scanned ${result.scanned}, created ${result.created}, deduped ${result.deduped}.`,
      );
    } catch (error) {
      toast.error(
        getApplicationErrorMessage(error, '') || 'Failed to create demands from inventory',
      );
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Low-Stock Intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Root location id (optional)"
              value={rootLocationId}
              onChange={(event) => setRootLocationId(event.target.value)}
            />
            <Input
              placeholder="Target main store location id (optional)"
              value={targetMainStoreLocationId}
              onChange={(event) => setTargetMainStoreLocationId(event.target.value)}
            />
            <Input
              type="number"
              min={1}
              max={500}
              placeholder="Low stock scan limit"
              value={lowStockLimit}
              onChange={(event) => setLowStockLimit(event.target.value)}
            />
            <Button onClick={onSubmit} disabled={isLoading}>
              Run intake
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
