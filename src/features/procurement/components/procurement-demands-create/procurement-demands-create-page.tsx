import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useCreateProcurementDemandMutation } from '../../api/procurement.api';

export function ProcurementDemandsCreatePage() {
  const navigate = useNavigate();
  const [sourceModule, setSourceModule] = useState('general');
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('unit');
  const [quantity, setQuantity] = useState('1');
  const [estimatedUnitCostPsw, setEstimatedUnitCostPsw] = useState('0');
  const [urgency, setUrgency] = useState('1');
  const [neededBy, setNeededBy] = useState('');
  const [note, setNote] = useState('');
  const neededByDate = neededBy ? new Date(neededBy) : undefined;
  const [createDemand, { isLoading }] = useCreateProcurementDemandMutation();

  const onSubmit = async () => {
    if (!sourceModule.trim() || !itemCode.trim() || !itemName.trim()) {
      toast.error('Source module, item code, and item name are required');
      return;
    }
    const parsedQty = Number(quantity);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }
    const parsedUnitCost = Number(estimatedUnitCostPsw);
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      toast.error('Estimated unit cost must be zero or positive');
      return;
    }

    try {
      await createDemand({
        sourceModule: sourceModule.trim(),
        itemCode: itemCode.trim(),
        itemName: itemName.trim(),
        unit: unit.trim() || 'unit',
        quantity: parsedQty,
        estimatedUnitCostPsw: parsedUnitCost,
        urgency: Number(urgency),
        neededBy: neededBy ? new Date(neededBy).toISOString() : null,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Procurement demand created');
      navigate('/procurement/demands');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create demand');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Procurement Demand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Source Module</FieldLabel>
                <Select value={sourceModule} onValueChange={setSourceModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="fleet_transport">Fleet Transport</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Urgency</FieldLabel>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Item Code</FieldLabel>
                <Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Item Name</FieldLabel>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Unit</FieldLabel>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Quantity</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Estimated Unit Cost (PSW)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={estimatedUnitCostPsw}
                  onChange={(e) => setEstimatedUnitCostPsw(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Needed By</FieldLabel>
                <DateTimePicker
                  value={neededByDate}
                  onChange={(value) => setNeededBy(value ? value.toISOString() : '')}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save demand
              </Button>
              <Button variant="outline" onClick={() => navigate('/procurement/demands')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
