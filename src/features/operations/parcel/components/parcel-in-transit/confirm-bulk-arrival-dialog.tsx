import {
  ReceivingOfficeField,
  useReceivingOfficeChoice,
} from '@/features/operations/parcel-receiving-office';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ParcelSearchRow } from '../../api/parcel.api';

export function ConfirmBulkArrivalDialog({
  open,
  parcels,
  isConfirming,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  parcels: ParcelSearchRow[];
  isConfirming: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (receivingOfficeId?: string) => Promise<void>;
}) {
  const locations = new Set(parcels.map((parcel) => parcel.pickupLocationId));
  const office = useReceivingOfficeChoice({
    enabled: open,
    locationId: parcels[0]?.pickupLocationId,
    allLocations: locations.size > 1,
  });
  const mixedNeedsSplit =
    locations.size > 1 &&
    parcels.some(
      (parcel) =>
        office.options.filter((option) => option.locationId === parcel.pickupLocationId).length > 1,
    );
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isConfirming && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark {parcels.length} parcels as arrived?</AlertDialogTitle>
          <AlertDialogDescription>
            All selected parcels will move to receiver handling together. If any parcel is no longer
            eligible, none of the selected parcels will be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-3 text-sm">
          {parcels.map((parcel) => (
            <div key={parcel.id} className="flex items-center justify-between gap-3">
              <span className="font-medium">{parcel.bookingCode}</span>
              <span className="truncate text-muted-foreground">{parcel.receiverName ?? '-'}</span>
            </div>
          ))}
        </div>

        {mixedNeedsSplit ? (
          <p className="text-sm">
            Receive parcels for a location with multiple offices in a separate batch.
          </p>
        ) : locations.size <= 1 ? (
          <ReceivingOfficeField
            {...office}
            allowAutomatic={office.options.length <= 1}
            disabled={isConfirming}
          />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            onClick={() => void onConfirm(office.officeId || undefined)}
            disabled={
              isConfirming ||
              office.isLoading ||
              office.isError ||
              parcels.length === 0 ||
              mixedNeedsSplit ||
              (locations.size <= 1 && office.options.length > 1 && !office.officeId)
            }
          >
            {isConfirming ? 'Marking Arrived...' : 'Confirm Batch Arrival'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
