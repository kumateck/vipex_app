import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ContactOutcome } from './types';

type ParcelCallOutcomeDialogProps = {
  selectedParcel: ParcelSearchRow | null;
  outcome: ContactOutcome;
  onOutcomeChange: (value: ContactOutcome) => void;
  useSecondReceiver: boolean;
  onUseSecondReceiverChange: (value: boolean) => void;
  secondReceiverName: string;
  onSecondReceiverNameChange: (value: string) => void;
  secondReceiverPhone: string;
  onSecondReceiverPhoneChange: (value: string) => void;
  sendSms: boolean;
  onSendSmsChange: (value: boolean) => void;
  sendEmail: boolean;
  onSendEmailChange: (value: boolean) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
};

export function ParcelCallOutcomeDialog({
  selectedParcel,
  outcome,
  onOutcomeChange,
  useSecondReceiver,
  onUseSecondReceiverChange,
  secondReceiverName,
  onSecondReceiverNameChange,
  secondReceiverPhone,
  onSecondReceiverPhoneChange,
  sendSms,
  onSendSmsChange,
  sendEmail,
  onSendEmailChange,
  isSaving,
  onClose,
  onSave,
}: ParcelCallOutcomeDialogProps) {
  return (
    <Dialog open={Boolean(selectedParcel)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Call Outcome</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {selectedParcel ? `Booking: ${selectedParcel.bookingCode}` : ''}
          </p>

          <div className="space-y-2">
            <Label>Outcome</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant={outcome === 'follow_up' ? 'default' : 'outline'}
                onClick={() => onOutcomeChange('follow_up')}
              >
                Customer will get back
              </Button>
              <Button
                type="button"
                variant={outcome === 'pickup' ? 'default' : 'outline'}
                onClick={() => onOutcomeChange('pickup')}
              >
                Customer will come (Awaiting Pickup)
              </Button>
              <Button
                type="button"
                variant={outcome === 'delivery' ? 'default' : 'outline'}
                onClick={() => onOutcomeChange('delivery')}
              >
                Customer wants delivery
              </Button>
            </div>
          </div>

          {outcome === 'pickup' ? (
            <div className="space-y-3 rounded-md border p-3">
              <Button
                type="button"
                variant={useSecondReceiver ? 'default' : 'outline'}
                onClick={() => onUseSecondReceiverChange(!useSecondReceiver)}
              >
                {useSecondReceiver ? 'Second Receiver Enabled' : 'Use Second Receiver'}
              </Button>

              {useSecondReceiver ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="second-receiver-name">Second Receiver Name</Label>
                    <Input
                      id="second-receiver-name"
                      value={secondReceiverName}
                      onChange={(event) => onSecondReceiverNameChange(event.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="second-receiver-phone">Second Receiver Telephone</Label>
                    <Input
                      id="second-receiver-phone"
                      value={secondReceiverPhone}
                      onChange={(event) =>
                        onSecondReceiverPhoneChange(limitPhoneDigits(event.target.value))
                      }
                      placeholder="Telephone number"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={PHONE_DIGITS}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Send Notification</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-sms">Send SMS</Label>
              <Checkbox
                id="send-sms"
                checked={sendSms}
                onCheckedChange={(checked) => onSendSmsChange(checked === true)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-email">Send Email</Label>
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => onSendEmailChange(checked === true)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSave()} disabled={isSaving}>
            Save Outcome
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
