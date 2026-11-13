import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuthorizePickupForm } from '@/features/operations/parcel/components/receiver-otp-exception';
import {
  OTP_AUTHORIZATION_WORKFLOW_LABELS,
  type OtpApprovalQueueItem,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';

type Props = {
  parcel: OtpApprovalQueueItem;
  workflow: OtpAuthorizationWorkflow;
  onClose: () => void;
  onApproved: (message: string) => void;
  onRestoreFocus: (event: Event) => void;
};

export function OtpApprovalDialog({
  parcel,
  workflow,
  onClose,
  onApproved,
  onRestoreFocus,
}: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent onCloseAutoFocus={onRestoreFocus}>
        <DialogHeader>
          <DialogTitle>Authorize pickup without OTP</DialogTitle>
          <DialogDescription>
            {parcel.bookingCode} · {parcel.destinationName} ·{' '}
            {OTP_AUTHORIZATION_WORKFLOW_LABELS[workflow]}
          </DialogDescription>
        </DialogHeader>
        <AuthorizePickupForm
          parcel={parcel}
          queueRequest={{
            id: parcel.otpRequestId,
            workflow,
            target: parcel.otpTarget === 'second' ? 'second' : 'main',
          }}
          onApproved={onApproved}
        />
      </DialogContent>
    </Dialog>
  );
}
