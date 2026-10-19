import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { DeliveryFeeEditDialog } from '../../dialogs';
import { useDeliveryFeeEdit } from '../../hooks';
import type { DeliveryFeeEditButtonProps } from '../../types';

export const DeliveryFeeEditButton = memo(function DeliveryFeeEditButton({
  parcelId,
  bookingCode,
  disabled,
}: DeliveryFeeEditButtonProps) {
  const editor = useDeliveryFeeEdit(parcelId);
  return (
    <>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={editor.show}>
        Edit Delivery Fee
      </Button>
      {editor.open ? <DeliveryFeeEditDialog bookingCode={bookingCode} editor={editor} /> : null}
    </>
  );
});
