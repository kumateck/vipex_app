import { lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ParcelFullDetails, ParcelSearchRow } from '../../api/parcel.api';
import { ParcelInternalHolderBadge } from '../parcel-internal-holder-badge';

const ParcelQrCode = lazy(() =>
  import('./parcel-qr-code').then((module) => ({ default: module.ParcelQrCode })),
);

type ParcelDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  details: ParcelFullDetails | undefined;
  isDetailsLoading: boolean;
  branchNameById: Map<string, string>;
  selectedParcelRow: ParcelSearchRow | undefined;
  formatConsignmentLabel: (serialForDay: number | null | undefined) => string;
  formatCurrency: (amountPsw: number) => string;
  formatDate: (value: string | null | undefined) => string;
  paymentMethodLabel: (method: number) => string;
  showQrCode?: boolean;
};

export function ParcelDetailsDialog({
  open,
  onClose,
  details,
  isDetailsLoading,
  branchNameById,
  selectedParcelRow,
  formatConsignmentLabel,
  formatCurrency,
  formatDate,
  paymentMethodLabel,
  showQrCode = false,
}: ParcelDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parcel Details</DialogTitle>
        </DialogHeader>

        {!details || isDetailsLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading details...</div>
        ) : (
          (() => {
            const activeConsignment =
              details.consignments.find((consignment) => !consignment.removedAt) ??
              details.consignments[0];
            const totalPaidPsw = details.payments.reduce(
              (sum, payment) => sum + payment.grossAmountPsw,
              0,
            );
            const paymentMethods = Array.from(
              new Set(details.payments.map((payment) => paymentMethodLabel(payment.method))),
            );
            const hasPaid = totalPaidPsw > 0;
            return (
              <div className="space-y-2 text-sm">
                {showQrCode ? (
                  <Suspense
                    fallback={
                      <div className="mb-5 grid min-h-64 place-items-center rounded-lg border bg-muted/30 text-muted-foreground">
                        Loading QR code...
                      </div>
                    }
                  >
                    <ParcelQrCode
                      bookingCode={details.parcel.bookingCode}
                      trackingCode={details.parcel.trackingCode}
                    />
                  </Suspense>
                ) : null}
                <p>
                  <strong>Booking:</strong> {details.parcel.bookingCode}
                </p>
                <p>
                  <strong>Parcel Details:</strong> {details.parcel.parcelDetails || '-'}
                </p>
                <p>
                  <strong>Parcel Content:</strong> {details.parcel.parcelContent || '-'}
                </p>
                <p>
                  <strong>Source:</strong> {branchNameById.get(details.parcel.sourceId) ?? '-'}
                </p>
                <p>
                  <strong>Destination:</strong>{' '}
                  {branchNameById.get(details.parcel.destinationId) ?? '-'}
                </p>
                <p>
                  <strong>Location:</strong> {selectedParcelRow?.pickupLocationName ?? '-'}
                </p>
                <div className="flex items-center gap-2">
                  <strong>Current Holder:</strong>
                  <ParcelInternalHolderBadge holder={details.internalHolder} />
                </div>
                <p>
                  <strong>Consignment:</strong>{' '}
                  {formatConsignmentLabel(activeConsignment?.serialForDay)}
                </p>
                <p>
                  <strong>Charge:</strong> {formatCurrency(details.parcel.chargePsw)}
                </p>
                <p>
                  <strong>To Be Paid:</strong> {formatCurrency(details.parcel.plannedToBePaidPsw)}
                </p>
                <p>
                  <strong>Paid:</strong> {hasPaid ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Paid Amount:</strong> {formatCurrency(totalPaidPsw)}
                </p>
                <p>
                  <strong>Mode of Payment:</strong>{' '}
                  {paymentMethods.length ? paymentMethods.join(', ') : '-'}
                </p>
                <p>
                  <strong>Created:</strong> {formatDate(details.parcel.createdAt)}
                </p>
                <p>
                  <strong>Payments:</strong> {details.payments.length}
                </p>
                <p>
                  <strong>Delivery Record:</strong>{' '}
                  {details.delivery ? details.delivery.status : 'None'}
                </p>
                <p>
                  <strong>Consignments:</strong> {details.consignments.length}
                </p>
              </div>
            );
          })()
        )}
      </DialogContent>
    </Dialog>
  );
}
