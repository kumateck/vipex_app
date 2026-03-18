import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReceiptSummary } from './parcel-form.types';
import { ParcelReceiptActions } from '../parcel-receipt-actions';

type ParcelReceiptsProps = {
  receipt: ReceiptSummary | null;
};

export function ParcelReceipts({ receipt }: ParcelReceiptsProps) {
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
            key={`${parcel.trackingCode}-${index}`}
            className="flex flex-col gap-3 rounded-lg border border-muted/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Parcel {index + 1}</p>
                <p className="text-xs text-muted-foreground">Tracking: {parcel.trackingCode}</p>
              </div>
              <Badge variant="outline">
                {parcel.paymentResponsibility === 'SENDER' ? 'Paid' : 'Pay on pickup'}
              </Badge>
            </div>
            <ParcelReceiptActions
              bookingId={receipt.bookingId}
              trackingCode={parcel.trackingCode}
              paymentResponsibility={parcel.paymentResponsibility}
              amountCedis={parcel.amountCedis}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
