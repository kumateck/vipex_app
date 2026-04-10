import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { CommunicationEngagementTarget } from '@/features/communication/api/communication.api';

type CommunicationRequestChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: CommunicationEngagementTarget[];
  isLoadingTargets: boolean;
  isSubmitting: boolean;
  defaultTargetUserId?: string | null;
  onSubmit: (input: { targetUserId: string; reasonNote?: string | null }) => Promise<void>;
};

export function CommunicationRequestChatDialog({
  open,
  onOpenChange,
  targets,
  isLoadingTargets,
  isSubmitting,
  defaultTargetUserId,
  onSubmit,
}: CommunicationRequestChatDialogProps) {
  const [targetUserId, setTargetUserId] = useState('');
  const [reasonNote, setReasonNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setTargetUserId(defaultTargetUserId ?? '');
    setReasonNote('');
  }, [defaultTargetUserId, open]);

  const selectedTargetLabel = useMemo(
    () => targets.find((target) => target.id === targetUserId)?.fullname ?? '',
    [targetUserId, targets],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Direct Chat</DialogTitle>
          <DialogDescription>
            Request approval to start a one-on-one chat with a superior user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>User</Label>
            <Select
              value={targetUserId}
              onValueChange={setTargetUserId}
              disabled={isLoadingTargets}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingTargets ? 'Loading users...' : 'Select one user'}
                >
                  {selectedTargetLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{target.fullname}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[target.roleName, target.branchName, target.locationName]
                          .filter(Boolean)
                          .join(' • ') || 'No role assigned'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reasonNote}
              onChange={(event) => setReasonNote(event.target.value)}
              placeholder="Explain why you need this conversation"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ targetUserId, reasonNote: reasonNote.trim() || null })}
            disabled={!targetUserId || isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
