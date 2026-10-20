import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { ParcelCallNotificationFields } from '../parcel-status/parcel-call-notification-fields';
import type { useParcelCallNotificationResend } from '../../hooks';

type Props = ReturnType<typeof useParcelCallNotificationResend>['dialogProps'];
const OUTCOME_LABELS = {
  pickup: 'Customer will come (Awaiting Pickup)',
  delivery: 'Customer wants delivery',
  follow_up: 'Customer will get back',
};

export function ParcelCallNotificationResendContent({
  parcel,
  outcome,
  sendSms,
  onSendSmsChange,
  sendEmail,
  onSendEmailChange,
  includeSecondReceiver,
  onIncludeSecondReceiverChange,
  isSending,
  onClose,
  onResend,
}: Props) {
  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1 text-sm">
          <p>Booking: {parcel?.bookingCode}</p>
          <p>Saved outcome: {outcome ? OUTCOME_LABELS[outcome] : 'Unavailable'}</p>
          <p className="text-muted-foreground">
            The saved outcome and receiver details stay unchanged.
          </p>
        </div>
        <ParcelCallNotificationFields
          idPrefix="resend-call"
          sendSms={sendSms}
          onSendSmsChange={onSendSmsChange}
          sendEmail={sendEmail}
          onSendEmailChange={onSendEmailChange}
          disabled={isSending}
        />
        {parcel?.secondReceiverId ? (
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="resend-call-second-receiver">
              Also notify the saved second receiver
            </Label>
            <Checkbox
              id="resend-call-second-receiver"
              checked={includeSecondReceiver}
              disabled={isSending}
              onCheckedChange={(value) => onIncludeSecondReceiverChange(value === true)}
            />
          </div>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          onClick={() => void onResend()}
          disabled={isSending || !outcome || (!sendSms && !sendEmail)}
        >
          {isSending ? 'Sending…' : 'Resend Notification'}
        </Button>
      </DialogFooter>
    </>
  );
}
