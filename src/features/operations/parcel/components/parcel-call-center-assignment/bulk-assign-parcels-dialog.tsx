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

type BulkAssignParcelsDialogProps = {
  open: boolean;
  parcels: ParcelRow[];
  staffOptions: StaffOption[];
  selectedStaffId: string;
  onStaffIdChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onAssign: () => Promise<void>;
};

export function BulkAssignParcelsDialog({
  open,
  parcels,
  staffOptions,
  selectedStaffId,
  onStaffIdChange,
  isSaving,
  onClose,
  onAssign,
}: BulkAssignParcelsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Assign Parcels</DialogTitle>
          <DialogDescription>
            Review the selected parcels, then assign all of them to one call center representative.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assign all selected parcels to</Label>
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

          <div className="rounded-md border">
            <div className="border-b px-4 py-3 font-medium">
              Selected parcels ({parcels.length})
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {parcels.map((parcel) => (
                <div key={parcel.id} className="grid gap-1 px-4 py-3 text-sm md:grid-cols-3">
                  <span className="font-mono font-medium">{parcel.bookingCode}</span>
                  <span>
                    {parcel.receiverName ?? '-'} ({parcel.receiverPhone ?? '-'})
                  </span>
                  <span className="text-muted-foreground">{parcel.parcelDetails}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={onAssign}
            disabled={isSaving || !selectedStaffId || parcels.length === 0}
          >
            {isSaving ? 'Assigning...' : `Assign ${parcels.length} Parcels`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
