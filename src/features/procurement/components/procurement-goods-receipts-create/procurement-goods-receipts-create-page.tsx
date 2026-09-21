import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProcurementGoodsReceiptMutation } from '../../api/procurement.api';

function parseLines(value: string): {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  locationId?: string | null;
  batchNumber?: string | null;
  supplierBatchNumber?: string | null;
  manufacturedAt?: string | null;
  expiryDate?: string | null;
}[] {
  const parsed = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [
        purchaseOrderItemId,
        qtyRaw,
        locationIdRaw,
        batchRaw,
        supplierBatchRaw,
        mfgRaw,
        expiryRaw,
      ] = line.split(',').map((part) => part.trim());
      return {
        purchaseOrderItemId,
        receivedQuantity: Number(qtyRaw),
        locationId: locationIdRaw || null,
        batchNumber: batchRaw || null,
        supplierBatchNumber: supplierBatchRaw || null,
        manufacturedAt: mfgRaw ? new Date(mfgRaw).toISOString() : null,
        expiryDate: expiryRaw ? new Date(expiryRaw).toISOString() : null,
      };
    })
    .filter((line) => Boolean(line.purchaseOrderItemId));

  return parsed
    .filter((line) => Number.isFinite(line.receivedQuantity) && line.receivedQuantity > 0)
    .map((line) => ({
      purchaseOrderItemId: line.purchaseOrderItemId as string,
      receivedQuantity: line.receivedQuantity,
      locationId: line.locationId,
      batchNumber: line.batchNumber,
      supplierBatchNumber: line.supplierBatchNumber,
      manufacturedAt: line.manufacturedAt,
      expiryDate: line.expiryDate,
    }));
}

export function ProcurementGoodsReceiptsCreatePage() {
  const navigate = useNavigate();
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [linesInput, setLinesInput] = useState('');
  const [note, setNote] = useState('');
  const [createGoodsReceipt, { isLoading }] = useCreateProcurementGoodsReceiptMutation();

  const onSubmit = async () => {
    const lines = parseLines(linesInput);
    if (!purchaseOrderId.trim()) {
      toast.error('Purchase order id is required');
      return;
    }
    if (!lines.length) {
      toast.error('Provide at least one valid line');
      return;
    }

    try {
      const result = await createGoodsReceipt({
        purchaseOrderId: purchaseOrderId.trim(),
        note: note.trim() || null,
        lines,
      }).unwrap();
      toast.success(`Goods receipt ${result.receiptNo} created`);
      navigate('/procurement/goods-receipts');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create goods receipt');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Goods Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Purchase order id"
              value={purchaseOrderId}
              onChange={(event) => setPurchaseOrderId(event.target.value)}
            />
            <Textarea
              placeholder="Lines format: purchaseOrderItemId,receivedQuantity,locationId,batchNumber,supplierBatchNumber,manufacturedAtISO,expiryDateISO"
              value={linesInput}
              onChange={(event) => setLinesInput(event.target.value)}
            />
            <Textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button onClick={onSubmit} disabled={isLoading}>
              Create goods receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
