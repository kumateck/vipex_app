import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSendReceiptDialog } from '../hooks';
import type { DigitalReceiptChannel, ReceiptKind } from '../types';
import { RECEIPT_CHANNEL_LABEL } from '../utils';

const KIND_OPTIONS: Array<{ value: ReceiptKind; label: string }> = [
  { value: 'booking', label: 'Booking / sender receipt' },
  { value: 'receiver_payment', label: 'Receiver payment receipt' },
  { value: 'home_delivery', label: 'Home delivery receipt' },
];

export function SendReceiptDialog({
  parcelId,
  bookingCode,
  initialKind,
  onClose,
}: {
  parcelId: string;
  bookingCode: string;
  initialKind?: ReceiptKind;
  onClose: () => void;
}) {
  const dialog = useSendReceiptDialog(parcelId, onClose, initialKind);
  const { availability } = dialog;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send receipt</DialogTitle>
          <DialogDescription>
            Booking {bookingCode}. The customer gets a link to an online copy identical to the
            printed receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Receipt</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={dialog.kind}
              onValueChange={(value) => value && dialog.setKind(value as ReceiptKind)}
              className="flex-wrap justify-start"
            >
              {KIND_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Send by</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={dialog.channels}
              onValueChange={(value) => dialog.setChannels(value as DigitalReceiptChannel[])}
              className="flex-wrap justify-start"
            >
              <ToggleGroupItem value="sms" disabled={!availability.sms}>
                {RECEIPT_CHANNEL_LABEL.sms}
              </ToggleGroupItem>
              {availability.showWhatsApp ? (
                <ToggleGroupItem value="whatsapp" disabled={!availability.whatsapp}>
                  {RECEIPT_CHANNEL_LABEL.whatsapp}
                </ToggleGroupItem>
              ) : null}
              <ToggleGroupItem value="email" disabled={!availability.email}>
                {RECEIPT_CHANNEL_LABEL.email}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <p className="text-xs text-muted-foreground">
            {dialog.isLoading
              ? 'Loading recipients...'
              : dialog.recipients.length
                ? `To: ${dialog.recipients.map((r) => `${r.name} (${r.role})`).join(', ')}`
                : 'No recipient found for this receipt.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={dialog.isSending}>
            Cancel
          </Button>
          <Button
            onClick={dialog.submit}
            disabled={dialog.isSending || !dialog.channels.length || !dialog.recipients.length}
          >
            {dialog.isSending ? 'Sending...' : 'Send receipt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
