import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  useAdjustFleetMaintenancePartStockMutation,
  useListFleetMaintenancePartsQuery,
} from '../api/fleet-transport.api';

export function FleetMaintenanceStockMovementCreatePage() {
  const navigate = useNavigate();
  const { data: partsRes, refetch: refetchParts } = useListFleetMaintenancePartsQuery({
    pageSize: 100,
  });
  const parts = useMemo(() => partsRes?.data ?? [], [partsRes?.data]);
  const [adjustPartStock, { isLoading: saving }] = useAdjustFleetMaintenancePartStockMutation();

  const [partId, setPartId] = useState('');
  const [movementType, setMovementType] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [note, setNote] = useState('');

  const onCreate = async () => {
    if (!partId) {
      toast.error('Select a part');
      return;
    }
    try {
      await adjustPartStock({
        partId,
        movementType: Number(movementType),
        quantity: quantity.trim() ? Number(quantity) : 1,
        unitCostPsw: unitCost.trim() ? Number(unitCost) : undefined,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Part stock updated');
      setQuantity('1');
      setUnitCost('');
      setNote('');
      await refetchParts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update part stock');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Post Stock Movement</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/parts/movements">Movement history</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
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
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger>
                <SelectValue placeholder="Movement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Stock In</SelectItem>
                <SelectItem value="1">Stock Out</SelectItem>
                <SelectItem value="2">Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              placeholder="Quantity"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Unit cost (optional)"
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
            />
            <Input
              placeholder="Movement note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Post movement
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/maintenance')}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
