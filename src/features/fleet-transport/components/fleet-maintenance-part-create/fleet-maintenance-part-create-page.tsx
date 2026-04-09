import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCreateFleetMaintenancePartMutation } from '../../api/fleet-transport.api';

export function FleetMaintenancePartCreatePage() {
  const navigate = useNavigate();
  const [createPart, { isLoading: saving }] = useCreateFleetMaintenancePartMutation();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('unit');
  const [qtyOnHand, setQtyOnHand] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('0');
  const [averageUnitCost, setAverageUnitCost] = useState('0');
  const [note, setNote] = useState('');

  const onCreate = async () => {
    if (!sku.trim() || !name.trim()) {
      toast.error('Part SKU and name are required');
      return;
    }
    try {
      await createPart({
        sku: sku.trim(),
        name: name.trim(),
        category: category.trim() || null,
        unit: unit.trim() || 'unit',
        qtyOnHand: qtyOnHand.trim() ? Number(qtyOnHand) : 0,
        reorderLevel: reorderLevel.trim() ? Number(reorderLevel) : 0,
        averageUnitCostPsw: averageUnitCost.trim() ? Number(averageUnitCost) : 0,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Maintenance part created');
      navigate('/fleet-transport/maintenance');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create maintenance part');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Maintenance Part</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Part SKU"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
            />
            <Input
              placeholder="Part name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              placeholder="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <Input
              placeholder="Unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Qty on hand"
              value={qtyOnHand}
              onChange={(event) => setQtyOnHand(event.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Reorder level"
              value={reorderLevel}
              onChange={(event) => setReorderLevel(event.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Avg unit cost (psw)"
              value={averageUnitCost}
              onChange={(event) => setAverageUnitCost(event.target.value)}
            />
            <Input
              placeholder="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Create part
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/maintenance')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
