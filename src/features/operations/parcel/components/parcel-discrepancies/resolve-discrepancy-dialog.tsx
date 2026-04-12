import { useEffect, useState } from 'react';
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
import type { ParcelDiscrepancyRow } from '../../api/parcel.api';

type ResolveDiscrepancyDialogProps = {
  row: ParcelDiscrepancyRow | null;
  isResolving: boolean;
  onClose: () => void;
  onResolve: (resolutionNote: string) => Promise<void>;
};

export function ResolveDiscrepancyDialog({
  row,
  isResolving,
  onClose,
  onResolve,
}: ResolveDiscrepancyDialogProps) {
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!row) return;
    setResolutionNote('');
  }, [row]);

  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Discrepancy</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Tracking:</strong> {row?.trackingCode ?? '-'}
          </p>
          <p>
            <strong>Booking:</strong> {row?.bookingCode ?? '-'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution-note">Resolution Note</Label>
          <Input
            id="resolution-note"
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Optional note"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isResolving || !row}
            onClick={() => {
              if (!row) return;
              void onResolve(resolutionNote);
            }}
          >
            {isResolving ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
