import { useCallback, useState } from 'react';
import { isDigitalReceiptChannel } from '@/shared/digital-receipts/channels';
import { useReceiptDelivery } from './use-receipt-delivery';

export type BookingReceiptParcel = { parcelId?: string; isPaid: boolean };

/**
 * Digital delivery for the receipts of a just-created booking: paid parcels
 * get the payment receipt, unpaid ones the acknowledgement note.
 */
export function useBookingReceiptDelivery(
  customerId: string | undefined,
  parcels: BookingReceiptParcel[],
) {
  const delivery = useReceiptDelivery(customerId);
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const hasDigitalChoice = delivery.channels.some(
    (channel) => isDigitalReceiptChannel(channel) && delivery.availability[channel],
  );

  const send = useCallback(async () => {
    setIsSending(true);
    try {
      const ids = (paid: boolean) =>
        parcels.flatMap((parcel) =>
          parcel.parcelId && parcel.isPaid === paid ? [parcel.parcelId] : [],
        );
      await delivery.deliver(ids(true), 'sender_payment');
      await delivery.deliver(ids(false), 'booking');
      setHasSent(true);
    } finally {
      setIsSending(false);
    }
  }, [delivery, parcels]);

  return { delivery, send, isSending, hasSent, canSend: hasDigitalChoice && !isSending };
}
