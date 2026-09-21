import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProcurementPurchaseOrderFromAcceptedQuotesMutation } from '../api/procurement.api';

function parseIds(value: string): string[] {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProcurementPurchaseOrdersCreatePage() {
  const navigate = useNavigate();
  const [quoteIdsInput, setQuoteIdsInput] = useState('');
  const [note, setNote] = useState('');
  const [createPurchaseOrder, { isLoading }] =
    useCreateProcurementPurchaseOrderFromAcceptedQuotesMutation();

  const onSubmit = async () => {
    const quoteIds = parseIds(quoteIdsInput);
    if (!quoteIds.length) {
      toast.error('Provide at least one accepted quote id');
      return;
    }

    try {
      const result = await createPurchaseOrder({
        quoteIds,
        note: note.trim() || null,
      }).unwrap();
      toast.success(`Purchase order ${result.poNo} created`);
      navigate('/procurement/purchase-orders');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create purchase order');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Purchase Order From Accepted Quotes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Accepted quote IDs (comma or newline separated)"
              value={quoteIdsInput}
              onChange={(event) => setQuoteIdsInput(event.target.value)}
            />
            <Textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button onClick={onSubmit} disabled={isLoading}>
              Create purchase order
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
