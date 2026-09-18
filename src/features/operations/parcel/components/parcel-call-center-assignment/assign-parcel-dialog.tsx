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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { ParcelRow, StaffOption } from './call-center-assignment-types';

type AssignParcelDialogProps = {
  open: boolean;
  parcel: ParcelRow | null;
  staffOptions: StaffOption[];
  selectedStaffId: string;
  onStaffIdChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onAssign: () => Promise<void>;
};

export function AssignParcelDialog({
  open,
  parcel,
  staffOptions,
  selectedStaffId,
  onStaffIdChange,
  isSaving,
  onClose,
  onAssign,
}: AssignParcelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {parcel?.callCenterAssignedToUserName ? 'Reassign Parcel' : 'Assign Parcel'}
          </DialogTitle>
          <DialogDescription>
            Assign this parcel to a call center representative for follow-up calling.
          </DialogDescription>
        </DialogHeader>

        {parcel ? (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm rounded-md bg-muted/40 p-3">
              <p>
                <strong>Booking:</strong> {parcel.bookingCode}
              </p>
              <p>
                <strong>Receiver:</strong> {parcel.receiverName ?? '-'} (
                {parcel.receiverPhone ?? '-'})
              </p>
              <p>
                <strong>Details:</strong> {parcel.parcelDetails}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={selectedStaffId} onValueChange={onStaffIdChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onAssign} disabled={isSaving || !selectedStaffId}>
            {isSaving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
