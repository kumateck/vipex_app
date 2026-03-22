import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { STATUS_LABELS } from './customer-details.constants';
import { formatDate, formatMoney, paymentMethodLabel } from './customer-details.utils';

type ParcelTransactionDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: ParcelFullDetails | undefined;
  isLoading: boolean;
};

function detailRow(label: string, value: string | number | null | undefined) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm" key={label}>
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">
        {value == null || value === '' ? '-' : String(value)}
      </span>
    </div>
  );
}

export function ParcelTransactionDetailsDialog({
  open,
  onOpenChange,
  details,
  isLoading,
}: ParcelTransactionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parcel Transaction Details</DialogTitle>
        </DialogHeader>

        {!details || isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading details...</div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parcel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detailRow('Tracking', details.parcel.trackingCode)}
                {detailRow('Booking', details.parcel.bookingCode)}
                {detailRow('Status', STATUS_LABELS[details.parcel.status] ?? details.parcel.status)}
                {detailRow('Source Branch ID', details.parcel.sourceId)}
                {detailRow('Destination Branch ID', details.parcel.destinationId)}
                {detailRow('Parcel Details', details.parcel.parcelDetails)}
                {detailRow('Parcel Content', details.parcel.parcelContent)}
                {detailRow('Charge', formatMoney(details.parcel.chargePsw))}
                {detailRow('Planned To Be Paid', formatMoney(details.parcel.plannedToBePaidPsw))}
                {detailRow('Payment Method', paymentMethodLabel(details.parcel.method))}
                {detailRow('Created At', formatDate(details.parcel.createdAt))}
                {detailRow('Received At', formatDate(details.parcel.receivedAt))}
                {detailRow('Confirmed At', formatDate(details.parcel.confirmedAt))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Payment Records ({details.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {details.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                ) : (
                  details.payments.map((payment) => (
                    <div key={payment.id} className="space-y-1 rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{formatMoney(payment.grossAmountPsw)}</span>
                        <Badge variant="outline">Receipt: {payment.receiptNo ?? '-'}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Received: {formatDate(payment.receivedAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Method: {paymentMethodLabel(payment.method)}
                      </p>
                      {payment.notes ? <p>Notes: {payment.notes}</p> : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!details.delivery ? (
                  <p className="text-sm text-muted-foreground">No delivery record found.</p>
                ) : (
                  <>
                    {detailRow('Mode', details.delivery.mode)}
                    {detailRow('Status', details.delivery.status)}
                    {detailRow('Dropoff Address', details.delivery.dropoffAddress)}
                    {detailRow('Delivery Charge', formatMoney(details.delivery.chargePsw))}
                    {detailRow('Amount Paid', formatMoney(details.delivery.amountPaidPsw))}
                    {detailRow('Delivered At', formatDate(details.delivery.deliveredAt))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Consignment History ({details.consignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {details.consignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No consignment association found.</p>
                ) : (
                  details.consignments.map((consignment) => (
                    <div
                      key={`${consignment.consignmentId}-${consignment.addedAt}`}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="font-medium">{consignment.code}</p>
                      <p className="text-muted-foreground">
                        Date: {formatDate(consignment.consignmentDate)}
                      </p>
                      <p className="text-muted-foreground">
                        Route: {consignment.sourceId} to {consignment.destinationId}
                      </p>
                      <p className="text-muted-foreground">
                        Added: {formatDate(consignment.addedAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Removed: {formatDate(consignment.removedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
