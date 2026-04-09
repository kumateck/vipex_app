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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

type SelectOption = {
  id: string;
  name: string;
};

type EditParcelDetailsDialogProps = {
  open: boolean;
  editSourceLocationId: string;
  onEditSourceLocationIdChange: (value: string) => void;
  sourceLocationOptions: SelectOption[];
  editDestinationId: string;
  onEditDestinationIdChange: (value: string) => void;
  editDestinationOptions: SelectOption[];
  editPickupLocationId: string;
  onEditPickupLocationIdChange: (value: string) => void;
  editLocationOptions: SelectOption[];
  editSenderPhone: string;
  onEditSenderPhoneChange: (value: string) => void;
  editSenderPhone2: string;
  onEditSenderPhone2Change: (value: string) => void;
  editReceiverPhone: string;
  onEditReceiverPhoneChange: (value: string) => void;
  editReceiverPhone2: string;
  onEditReceiverPhone2Change: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export function EditParcelDetailsDialog({
  open,
  editSourceLocationId,
  onEditSourceLocationIdChange,
  sourceLocationOptions,
  editDestinationId,
  onEditDestinationIdChange,
  editDestinationOptions,
  editPickupLocationId,
  onEditPickupLocationIdChange,
  editLocationOptions,
  editSenderPhone,
  onEditSenderPhoneChange,
  editSenderPhone2,
  onEditSenderPhone2Change,
  editReceiverPhone,
  onEditReceiverPhoneChange,
  editReceiverPhone2,
  onEditReceiverPhone2Change,
  isSaving,
  onClose,
  onSave,
}: EditParcelDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Parcel Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-source-location">Source Location</Label>
            <Select value={editSourceLocationId} onValueChange={onEditSourceLocationIdChange}>
              <SelectTrigger id="edit-source-location">
                <SelectValue placeholder="Select source location" />
              </SelectTrigger>
              <SelectContent>
                {sourceLocationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-destination-branch">Destination Branch</Label>
            <Select value={editDestinationId} onValueChange={onEditDestinationIdChange}>
              <SelectTrigger id="edit-destination-branch">
                <SelectValue placeholder="Select destination branch" />
              </SelectTrigger>
              <SelectContent>
                {editDestinationOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-pickup-location">Pickup Location</Label>
            <Select
              value={editPickupLocationId}
              onValueChange={onEditPickupLocationIdChange}
              disabled={!editDestinationId}
            >
              <SelectTrigger id="edit-pickup-location">
                <SelectValue placeholder="Select pickup location" />
              </SelectTrigger>
              <SelectContent>
                {editLocationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-sender-phone">Sender Telephone 1</Label>
              <Input
                id="edit-sender-phone"
                value={editSenderPhone}
                onChange={(event) => onEditSenderPhoneChange(event.target.value)}
                placeholder="0240000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sender-phone2">Sender Telephone 2</Label>
              <Input
                id="edit-sender-phone2"
                value={editSenderPhone2}
                onChange={(event) => onEditSenderPhone2Change(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-receiver-phone">Receiver Telephone 1</Label>
              <Input
                id="edit-receiver-phone"
                value={editReceiverPhone}
                onChange={(event) => onEditReceiverPhoneChange(event.target.value)}
                placeholder="0240000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-receiver-phone2">Receiver Telephone 2</Label>
              <Input
                id="edit-receiver-phone2"
                value={editReceiverPhone2}
                onChange={(event) => onEditReceiverPhone2Change(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
