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
import { Badge } from '@/components/ui/badge';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelRow, StaffOption } from './shelf-picker-update-types';

const getStatusLabel = (status: number) => {
  switch (status) {
    case ParcelStatus.CREATED:
      return 'Created';
    case ParcelStatus.AWAITING_PICKUP:
      return 'Awaiting Pickup';
    default:
      return 'Unknown';
  }
};

type UpdateShelfPickerDialogProps = {
  open: boolean;
  parcel: ParcelRow | null;
  staffOptions: StaffOption[];
  selectedStaffId: string;
  onStaffIdChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onUpdate: () => Promise<void>;
};

export function UpdateShelfPickerDialog({
  open,
  parcel,
  staffOptions,
  selectedStaffId,
  onStaffIdChange,
  isSaving,
  onClose,
  onUpdate,
}: UpdateShelfPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Shelf Picker</DialogTitle>
          <DialogDescription>
            Assign or update the shelf picker staff for this parcel. This will be prepopulated in
            the cashier view.
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
              <div className="flex items-center gap-2 pt-1">
                <strong>Status:</strong>
                <Badge variant="outline">{getStatusLabel(parcel.status)}</Badge>
                {parcel.plannedToBePaidPsw > 0 ? (
                  <Badge variant="destructive">To Be Paid</Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Shelf Picker Staff</Label>
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
              <p className="text-xs text-muted-foreground">
                Currently assigned: {parcel.pickerStaffName || 'Not assigned'}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={isSaving || !selectedStaffId}>
            {isSaving ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
