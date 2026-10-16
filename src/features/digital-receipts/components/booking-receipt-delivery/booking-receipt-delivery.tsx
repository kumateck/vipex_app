import { memo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useBookingReceiptDelivery,
  type BookingReceiptParcel,
} from '../../hooks/use-booking-receipt-delivery';
import { ReceiptDeliveryPicker } from '../receipt-delivery-picker';

/**
 * Shown with the receipts of a new booking: pick how the customer gets the
 * receipt (defaults to their last choice) and send the digital copies.
 * Physical copies are printed with the print buttons as before.
 */
export const BookingReceiptDelivery = memo(function BookingReceiptDelivery({
  customerId,
  parcels,
}: {
  customerId?: string;
  parcels: BookingReceiptParcel[];
}) {
  const { delivery, send, isSending, hasSent, canSend } = useBookingReceiptDelivery(
    customerId,
    parcels,
  );
  if (!delivery.isEnabled) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-muted/50 p-4 md:flex-row md:items-end md:justify-between">
      <ReceiptDeliveryPicker delivery={delivery} disabled={isSending} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void send()}
        disabled={!canSend}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSending ? 'Sending...' : hasSent ? 'Send again' : 'Send digital receipt'}
      </Button>
    </div>
  );
});
