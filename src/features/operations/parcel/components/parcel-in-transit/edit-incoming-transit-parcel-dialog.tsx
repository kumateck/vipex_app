import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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

type EditIncomingTransitParcelDialogProps = {
  open: boolean;
  onClose: () => void;
  editParcelDetails: string;
  onEditParcelDetailsChange: (value: string) => void;
  editReceiverName: string;
  onEditReceiverNameChange: (value: string) => void;
  editReceiverPhone: string;
  onEditReceiverPhoneChange: (value: string) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
};

export function EditIncomingTransitParcelDialog({
  open,
  onClose,
  editParcelDetails,
  onEditParcelDetailsChange,
  editReceiverName,
  onEditReceiverNameChange,
  editReceiverPhone,
  onEditReceiverPhoneChange,
  isSaving,
  onSave,
}: EditIncomingTransitParcelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Incoming Transit Parcel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-parcel-details">Parcel Details</Label>
            <Input
              id="edit-parcel-details"
              value={editParcelDetails}
              onChange={(event) => onEditParcelDetailsChange(event.target.value)}
              placeholder="Parcel details"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-receiver-name">Receiver Name</Label>
            <Input
              id="edit-receiver-name"
              value={editReceiverName}
              onChange={(event) => onEditReceiverNameChange(event.target.value)}
              placeholder="Receiver full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-receiver-phone">Receiver Telephone</Label>
            <Input
              id="edit-receiver-phone"
              value={editReceiverPhone}
              onChange={(event) => onEditReceiverPhoneChange(limitPhoneDigits(event.target.value))}
              placeholder="Receiver telephone"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_DIGITS}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              try {
                await onSave();
              } catch (error) {
                toast.error(getApplicationErrorMessage(error, '') || 'Failed to update parcel');
              }
            }}
            disabled={isSaving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
