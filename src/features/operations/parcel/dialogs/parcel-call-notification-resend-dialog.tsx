import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ParcelCallNotificationResendContent } from '../components/parcel-call-notification-resend';
import type { useParcelCallNotificationResend } from '../hooks';

type Props = ReturnType<typeof useParcelCallNotificationResend>['dialogProps'];

export function ParcelCallNotificationResendDialog(props: Props) {
  return (
    <Dialog
      open={Boolean(props.parcel)}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resend Notification</DialogTitle>
          <DialogDescription>
            Send another message for this saved call outcome. For a previous service error, check
            the provider’s delivery report before resending.
          </DialogDescription>
        </DialogHeader>
        <ParcelCallNotificationResendContent {...props} />
      </DialogContent>
    </Dialog>
  );
}
