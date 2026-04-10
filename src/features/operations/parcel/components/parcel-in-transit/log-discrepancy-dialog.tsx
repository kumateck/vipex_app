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
import { Textarea } from '@/components/ui/textarea';
import type { ParcelSearchRow } from '../../api/parcel.api';

type LogDiscrepancyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discrepancyParcel: ParcelSearchRow | null;
  missingTrackingCode: string;
  onMissingTrackingCodeChange: (value: string) => void;
  missingBookingCode: string;
  onMissingBookingCodeChange: (value: string) => void;
  discrepancyNotes: string;
  onDiscrepancyNotesChange: (value: string) => void;
  isLoggingDiscrepancy: boolean;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

export function LogDiscrepancyDialog({
  open,
  onOpenChange,
  discrepancyParcel,
  missingTrackingCode,
  onMissingTrackingCodeChange,
  missingBookingCode,
  onMissingBookingCodeChange,
  discrepancyNotes,
  onDiscrepancyNotesChange,
  isLoggingDiscrepancy,
  onCancel,
  onSave,
}: LogDiscrepancyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {discrepancyParcel
              ? 'Log Discrepancy: Record Not Physical'
              : 'Log Discrepancy: Physical Parcel Missing In System'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {discrepancyParcel ? (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Tracking:</strong> {discrepancyParcel.trackingCode}
              </p>
              <p>
                <strong>Booking:</strong> {discrepancyParcel.bookingCode}
              </p>
              <p className="text-muted-foreground">
                Use this when the parcel exists in the incoming in-transit list but the physical
                item is not available.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="missing-tracking-code">Tracking Code</Label>
                <Input
                  id="missing-tracking-code"
                  value={missingTrackingCode}
                  onChange={(event) => onMissingTrackingCodeChange(event.target.value)}
                  placeholder="Enter scanned or printed tracking code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-booking-code">Booking Code</Label>
                <Input
                  id="missing-booking-code"
                  value={missingBookingCode}
                  onChange={(event) => onMissingBookingCodeChange(event.target.value)}
                  placeholder="Optional booking code"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Use this when the parcel is physically present but no matching in-transit record
                exists in the system.
              </p>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="discrepancy-notes">Notes</Label>
            <Textarea
              id="discrepancy-notes"
              value={discrepancyNotes}
              onChange={(event) => onDiscrepancyNotesChange(event.target.value)}
              placeholder="Describe what was found, who checked, or any follow-up needed"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoggingDiscrepancy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              try {
                await onSave();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to log discrepancy');
              }
            }}
            disabled={isLoggingDiscrepancy}
          >
            {isLoggingDiscrepancy ? 'Saving...' : 'Save Discrepancy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
