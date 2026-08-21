import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ParcelDiscrepancyRow } from '../../api/parcel.api';
import { discrepancyTypeLabel, formatDiscrepancyDate } from './utils';

type DiscrepancyDetailDialogProps = {
  row: ParcelDiscrepancyRow | null;
  branchNameById: Map<string, string>;
  onClose: () => void;
};

export function DiscrepancyDetailDialog({
  row,
  branchNameById,
  onClose,
}: DiscrepancyDetailDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discrepancy Detail</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Booking:</strong> {row?.bookingCode ?? '-'}
          </p>
          <p>
            <strong>Type:</strong> {discrepancyTypeLabel(row?.discrepancyType)}
          </p>
          <p>
            <strong>Source:</strong>{' '}
            {row?.sourceId ? (branchNameById.get(row.sourceId) ?? '-') : '-'}
          </p>
          <p>
            <strong>Destination:</strong> {row?.destinationLocationName ?? '-'} /{' '}
            {row?.destinationId ? (branchNameById.get(row.destinationId) ?? '-') : '-'}
          </p>
          <p>
            <strong>Logged At:</strong> {formatDiscrepancyDate(row?.createdAt)}
          </p>
          <p>
            <strong>Notes:</strong> {row?.notes?.trim() || '-'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
