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
                <p className="text-xs text-muted-foreground">Booking: {parcel.bookingCode}</p>
              </div>
              <Badge variant="outline">
                {parcel.receiverToPayCedis > 0 ? 'Receiver to pay' : 'Sender paid'}
              </Badge>
            </div>
            <ParcelReceiptActions
              data={parcel}
              triggerLabel="Print Sticker + Invoice"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
