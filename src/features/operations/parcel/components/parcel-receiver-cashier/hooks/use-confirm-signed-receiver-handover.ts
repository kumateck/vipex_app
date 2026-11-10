import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useReceiptDelivery } from '@/features/digital-receipts/hooks';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { PendingReceiverHandoverRow } from '@/shared/shipments/receiver-cashier-signature';
import { useReceiverReceiptReprint } from '../../../hooks';
import { useConfirmReceiverHandoverMutation } from '../services';

export function useConfirmSignedReceiverHandover(
  row: PendingReceiverHandoverRow | undefined,
  onDone: () => void,
) {
  const [confirm] = useConfirmReceiverHandoverMutation();
  const receipt = useReceiverReceiptReprint();
  const delivery = useReceiptDelivery(row?.receiverId);
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const submit = async () => {
    if (locked.current || !row?.signedAt) return;
    locked.current = true;
    setSaving(true);
    let confirmed = false;
    try {
      const result = await confirm({ parcelId: row.id, handoverId: row.handoverId }).unwrap();
      confirmed = true;
      setFinished(true);
      if (result.alreadyConfirmed) {
        toast.info('This parcel was already confirmed. Use Delivered to reprint.');
        onDone();
        return;
      }
      toast.success('Parcel delivered');
      void delivery.deliver([row.id], 'receiver_payment');
      if (!delivery.includesPhysical) {
        onDone();
        return;
      }
      if (!(await receipt.print(row.id))) onDone();
    } catch (error) {
      if (confirmed) {
        toast.warning('Delivery saved. Open Delivered to print the receipt.');
        onDone();
      } else {
        toast.error(getErrorMessage(error, '') || 'Could not confirm receipt');
      }
    } finally {
      setSaving(false);
      locked.current = false;
    }
  };

  return { submit, saving, finished, receipt, delivery };
}
