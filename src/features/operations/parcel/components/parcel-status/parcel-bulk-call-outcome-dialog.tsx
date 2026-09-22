import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ContactOutcome } from './types';

const outcomeOptions: Array<{ value: ContactOutcome; label: string; status: string }> = [
  { value: 'follow_up', label: 'Customer will get back', status: 'Customer Contacted' },
  { value: 'pickup', label: 'Customer will come', status: 'Awaiting Pickup' },
  { value: 'delivery', label: 'Customer wants delivery', status: 'Home Delivery Requested' },
];

export function ParcelBulkCallOutcomeDialog({
  parcels,
  outcome,
  onOutcomeChange,
  onClose,
  onSave,
  isSaving,
}: {
  parcels: ParcelSearchRow[] | null;
  outcome: ContactOutcome;
  onOutcomeChange: (value: ContactOutcome) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}) {
  const selected = outcomeOptions.find((option) => option.value === outcome)!;

  return (
    <Dialog open={parcels !== null} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Call Outcome</DialogTitle>
          <DialogDescription>
            Preview the {parcels?.length ?? 0} selected parcels and the status to apply.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2" role="group" aria-label="Call outcome">
            {outcomeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={outcome === option.value ? 'default' : 'outline'}
                className="w-full"
                onClick={() => onOutcomeChange(option.value)}
                disabled={isSaving}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <p className="text-sm">
            New status: <strong>{selected.status}</strong>
          </p>
          <div className="max-h-52 overflow-y-auto rounded-md border p-3">
            <ul className="space-y-2 text-sm">
              {parcels?.map((parcel) => (
                <li key={parcel.id} className="flex justify-between gap-3">
                  <span className="font-medium">{parcel.bookingCode}</span>
                  <span className="text-muted-foreground">{parcel.receiverName ?? '-'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving || !parcels?.length}
          >
            {isSaving ? 'Saving...' : `Save ${parcels?.length ?? 0} Outcomes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
