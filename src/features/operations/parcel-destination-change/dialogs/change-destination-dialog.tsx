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
import { Textarea } from '@/components/ui/textarea';
import {
  DESTINATION_CHANGE_EFFECTS,
  DESTINATION_CHANGE_REASON_MAX,
} from '@/shared/shipments/parcel-destination-change';
import { useParcelDestinationChange } from '../hooks';
import type { DestinationChangeParcel } from '../types';

export function ChangeDestinationDialog({
  parcel,
  open,
  onClose,
}: {
  parcel: DestinationChangeParcel;
  open: boolean;
  onClose: () => void;
}) {
  const form = useParcelDestinationChange(parcel.id, open, onClose);
  const close = () => {
    if (form.saving) return;
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? close() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Destination</DialogTitle>
          <DialogDescription>
            Move {parcel.bookingCode} to another destination branch and pickup location.
          </DialogDescription>
        </DialogHeader>
        {form.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load destination options.
          </p>
        ) : form.isLoading ? (
          <p role="status" className="text-sm">
            Loading destinations…
          </p>
        ) : form.restriction ? (
          <p role="alert" className="text-sm text-muted-foreground">
            {form.restriction}
          </p>
        ) : (
          <div className="space-y-4">
            {form.phase ? (
              <p role="note" className="rounded-md bg-muted p-3 text-sm">
                {DESTINATION_CHANGE_EFFECTS[form.phase]}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="change-destination-branch">Destination Branch</Label>
              <Select value={form.destinationId} onValueChange={form.setDestinationId}>
                <SelectTrigger id="change-destination-branch" disabled={form.saving}>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {form.branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-destination-location">Pickup Location</Label>
              {form.locations.length ? (
                <Select value={form.pickupLocationId} onValueChange={form.setPickupLocationId}>
                  <SelectTrigger id="change-destination-location" disabled={form.saving}>
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This branch has no receiving-enabled pickup locations.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-destination-reason">Reason</Label>
              <Textarea
                id="change-destination-reason"
                value={form.reason}
                onChange={(event) => form.setReason(event.target.value)}
                maxLength={DESTINATION_CHANGE_REASON_MAX}
                rows={3}
                disabled={form.saving}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={form.saving}>
            Cancel
          </Button>
          <Button onClick={() => void form.save()} disabled={!form.canSave}>
            {form.saving ? 'Saving…' : 'Change Destination'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
