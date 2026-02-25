import { Button } from '@/components/ui/button';
import { printParcelDocument } from '../utils/parcel-print';

type ParcelReceiptActionsProps = {
  bookingId: string;
  trackingCode: string;
  paymentResponsibility: 'SENDER' | 'RECEIVER';
  amountCedis: number;
};

export function ParcelReceiptActions({
  bookingId,
  trackingCode,
  paymentResponsibility,
  amountCedis,
}: ParcelReceiptActionsProps) {
  const printSticker = () => {
    printParcelDocument({
      title: 'Parcel Sticker',
      lines: [`Booking: ${bookingId}`, `Tracking: ${trackingCode}`],
    });
  };

  const printPaymentOrInvoice = () => {
    const title = paymentResponsibility === 'SENDER' ? 'Payment Receipt' : 'To-Be-Paid Invoice';
    const label = paymentResponsibility === 'SENDER' ? 'Paid Amount' : 'Amount Due';

    printParcelDocument({
      title,
      lines: [`Booking: ${bookingId}`, `Tracking: ${trackingCode}`, `${label}: GHS ${amountCedis.toFixed(2)}`],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={printPaymentOrInvoice}>
        Print {paymentResponsibility === 'SENDER' ? 'Payment Receipt' : 'Invoice'}
      </Button>
      <Button type="button" onClick={printSticker}>
        Print Parcel Sticker
      </Button>
    </div>
  );
}
