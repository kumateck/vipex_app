import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReceiptSummary } from './parcel-form.types';
import { getParcelCreationPrintSelection } from './parcel-create-print.utils';
import { ParcelReceiptActions } from '../parcel-receipt-actions';

type ParcelReceiptsProps = {
  receipt: ReceiptSummary | null;
  autoPrint?: boolean;
};

export function ParcelReceipts({ receipt, autoPrint = false }: ParcelReceiptsProps) {
  const [activeAutoPrintIndex, setActiveAutoPrintIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!receipt || !autoPrint || receipt.parcels.length === 0) {
      setActiveAutoPrintIndex(null);
      return;
    }
    setActiveAutoPrintIndex(0);
  }, [autoPrint, receipt?.bookingId, receipt?.parcels.length]);

  if (!receipt) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>Print stickers and receipts for the latest booking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {receipt.parcels.map((parcel, index) => (
          <div
            key={parcel.parcelId ?? parcel.trackingCode}
            className="flex flex-col gap-3 rounded-lg border border-muted/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Parcel {index + 1}</p>
                <p className="text-xs text-muted-foreground">Booking: {parcel.bookingCode}</p>
              </div>
              <Badge variant="outline">
                {parcel.receiverToPayCedis > 0 ? 'Receiver to pay' : 'Sender paid'}
              </Badge>
            </div>
            <ParcelReceiptActions
              data={parcel}
              triggerLabel="Print Sticker + Invoice"
              autoPrint={activeAutoPrintIndex === index}
              autoPrintSelection={getParcelCreationPrintSelection(parcel)}
              mode="sender-payment"
              onAutoPrintComplete={() => {
                if (activeAutoPrintIndex !== index) return;
                setActiveAutoPrintIndex((current) => {
                  if (current == null) return current;
                  const next = current + 1;
                  return next < receipt.parcels.length ? next : null;
                });
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
