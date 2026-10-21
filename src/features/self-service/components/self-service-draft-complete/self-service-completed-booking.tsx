import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReceiptPrintData } from '@/features/operations/parcel/components/parcel-sticker-actions';

const ParcelStickerActions = lazy(() =>
  import('@/features/operations/parcel/components/parcel-sticker-actions').then((module) => ({
    default: module.ParcelStickerActions,
  })),
);

export function SelfServiceCompletedBooking({
  receipt,
  onDone,
}: {
  receipt: ReceiptPrintData;
  onDone: () => void;
}) {
  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Booking completed</CardTitle>
        <CardDescription>
          Booking: {receipt.bookingCode} · Tracking: {receipt.trackingCode}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the sticker copies and print. If printing fails, retry here for this saved booking.
          Printing verifies the saved payment status. Record any required sender payment first.
        </p>
        <Suspense fallback={<p className="text-sm">Loading sticker controls...</p>}>
          <ParcelStickerActions data={receipt} stickerOnly />
        </Suspense>
        <Button type="button" variant="outline" onClick={onDone}>
          Back to Self-Service Bookings
        </Button>
      </CardContent>
    </Card>
  );
}
