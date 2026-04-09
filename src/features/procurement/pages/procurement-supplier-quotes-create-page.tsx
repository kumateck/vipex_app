import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateProcurementSupplierQuoteMutation,
  useListProcurementDemandsQuery,
  useListProcurementSupplierOptionsQuery,
} from '../api/procurement.api';

export function ProcurementSupplierQuotesCreatePage() {
  const navigate = useNavigate();
  const [demandId, setDemandId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCostPsw, setUnitCostPsw] = useState('0');
  const [note, setNote] = useState('');

  const { data: demandsData } = useListProcurementDemandsQuery(
    useMemo(
      () => ({
        page: 1,
        pageSize: 200,
        filters: { status: 4 },
      }),
      [],
    ),
  );
  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();
  const [createQuote, { isLoading }] = useCreateProcurementSupplierQuoteMutation();

  const demands = demandsData?.data ?? [];

  const onSubmit = async () => {
    if (!demandId || !supplierId) {
      toast.error('Select demand and supplier');
      return;
    }
    try {
      await createQuote({
        demandId,
        supplierId,
        quantity: Number(quantity),
        unitCostPsw: Number(unitCostPsw),
        note: note.trim() || null,
      }).unwrap();
      toast.success('Supplier quote created');
      navigate('/procurement/supplier-quotes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create quote');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Supplier Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={demandId} onValueChange={setDemandId}>
              <SelectTrigger>
                <SelectValue placeholder="Select approved demand" />
              </SelectTrigger>
              <SelectContent>
                {demands.map((demand) => (
                  <SelectItem key={demand.id} value={demand.id}>
                    {demand.demandNo} - {demand.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Quantity"
            />
            <Input
              type="number"
              min={0}
              value={unitCostPsw}
              onChange={(event) => setUnitCostPsw(event.target.value)}
              placeholder="Unit cost (psw)"
            />
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
            />
            <Button onClick={onSubmit} disabled={isLoading}>
              Create quote
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
