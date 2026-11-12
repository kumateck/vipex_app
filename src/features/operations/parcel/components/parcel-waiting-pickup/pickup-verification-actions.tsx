import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import type { PickupOtpException } from './use-confirm-signed-office-pickup';

export function PickupVerificationActions({
  onClose,
  onRequestHomeDelivery,
  onConfirmDelivered,
  exception,
  isLoading,
  hasLoadError,
  isSaving,
  canConfirm,
}: {
  onClose: () => void;
  onRequestHomeDelivery: () => Promise<void>;
  onConfirmDelivered: (exception?: PickupOtpException) => Promise<void>;
  exception?: PickupOtpException;
  isLoading: boolean;
  hasLoadError: boolean;
  isSaving: boolean;
  canConfirm: boolean;
}) {
  return (
    <DialogFooter>
      <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await onRequestHomeDelivery();
          } catch (error) {
            toast.error(
              getApplicationErrorMessage(error, '') || 'Failed to move parcel to home delivery',
            );
          }
        }}
        disabled={isLoading || hasLoadError || isSaving}
      >
        Request Home Delivery
      </Button>
      <Button
        onClick={async () => {
          try {
            await onConfirmDelivered(exception);
          } catch (error) {
            toast.error(getApplicationErrorMessage(error, '') || 'Failed to confirm delivery');
          }
        }}
        disabled={isLoading || hasLoadError || isSaving || !canConfirm}
      >
        {isLoading
          ? 'Loading...'
          : isSaving
            ? 'Processing...'
            : exception
              ? 'Confirm with Admin Approval'
              : 'Confirm Delivered'}
      </Button>
    </DialogFooter>
  );
}
