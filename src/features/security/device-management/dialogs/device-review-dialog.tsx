import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { RegisteredDevice, ReviewAction } from '../types/device-management.types';
import { actionLabel } from '../utils/device-actions';

type Props = {
  selection: { device: RegisteredDevice; action: ReviewAction } | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isUpdating: boolean;
};

export function DeviceReviewDialog({ selection, onClose, onSubmit, isUpdating }: Props) {
  const [reason, setReason] = useState('');
  const action = selection?.action;
  const requiresReason = action === 'block' || action === 'permanently_deny' || action === 'revoke';
  return (
    <Dialog open={Boolean(selection)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action ? actionLabel(action) : 'Review device'}</DialogTitle>
          <DialogDescription>
            {selection?.device.deviceName} · {selection?.device.userName}.{' '}
            {action === 'permanently_deny'
              ? 'This registration can never be approved again.'
              : 'Any active device session is revoked when access is removed.'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Review reason"
          placeholder={requiresReason ? 'Reason (required)' : 'Reason (optional)'}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === 'permanently_deny' ? 'destructive' : 'default'}
            disabled={isUpdating || (requiresReason && !reason.trim())}
            onClick={() => {
              onSubmit(reason.trim());
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
