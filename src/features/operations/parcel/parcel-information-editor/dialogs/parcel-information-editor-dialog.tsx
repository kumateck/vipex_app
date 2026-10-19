import { ParcelSenderCorrection } from '../components/parcel-sender-correction';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { limitPhoneDigits, PHONE_DIGITS } from '@/lib/phone';
import type { useParcelInformationEditor } from '../hooks';

export function ParcelInformationEditorDialog({
  editor,
  bookingCode,
}: {
  editor: ReturnType<typeof useParcelInformationEditor>;
  bookingCode: string;
}) {
  return (
    <Dialog
      open={editor.open}
      onOpenChange={(open) => {
        if (!open) editor.close();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit parcel information</DialogTitle>
          <DialogDescription>
            Booking {bookingCode}. Receiver telephone changes also update the linked customer
            contact.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void editor.save();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="source-parcel-details">Parcel details</Label>
            <Input
              id="source-parcel-details"
              value={editor.parcelDetails}
              onChange={(event) => editor.setParcelDetails(event.target.value)}
              maxLength={255}
              disabled={editor.isSaving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-receiver-name">Receiver name</Label>
            <Input
              id="source-receiver-name"
              value={editor.receiverName}
              onChange={(event) => editor.setReceiverName(event.target.value)}
              maxLength={255}
              disabled={!editor.canEditReceiver || editor.isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-receiver-phone">Receiver telephone</Label>
            <Input
              id="source-receiver-phone"
              value={editor.receiverPhone}
              onChange={(event) => editor.setReceiverPhone(limitPhoneDigits(event.target.value))}
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_DIGITS}
              disabled={!editor.canEditReceiver || editor.isSaving}
            />
          </div>
          {!editor.canEditReceiver ? (
            <p className="text-sm text-muted-foreground">
              Update Customers permission is required to edit the receiver name or telephone.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={editor.close}
              disabled={editor.isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editor.isSaving}>
              {editor.isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
        {editor.canEditReceiver ? (
          <ParcelSenderCorrection parcel={editor.original} onCorrected={editor.close} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
