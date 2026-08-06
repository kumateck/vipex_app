import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DualListTransfer } from '@/components/ui/dual-list-transfer';
import type { CommunicationChannel } from '../../../api/communication.api';
import type { UserTransferItem } from '../types/communication-chat.types';

type ManageChannelMembersDialogProps = {
  managingChannel: CommunicationChannel | null;
  onOpenChange: (open: boolean) => void;
  allUserTransferItems: UserTransferItem[];
  channelMemberIds: string[];
  onChannelMemberIdsChange: (ids: string[]) => void;
  isAddingParticipants: boolean;
  isRemovingParticipant: boolean;
  onSave: () => void;
};

export function ManageChannelMembersDialog({
  managingChannel,
  onOpenChange,
  allUserTransferItems,
  channelMemberIds,
  onChannelMemberIdsChange,
  isAddingParticipants,
  isRemovingParticipant,
  onSave,
}: ManageChannelMembersDialogProps) {
  return (
    <Dialog open={Boolean(managingChannel)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Manage Members{managingChannel ? ` • ${managingChannel.name}` : ''}
          </DialogTitle>
        </DialogHeader>

        <DualListTransfer
          items={allUserTransferItems}
          selectedIds={channelMemberIds}
          onSelectedIdsChange={onChannelMemberIdsChange}
          leftTitle="Not In"
          rightTitle="In"
          disabled={isAddingParticipants || isRemovingParticipant}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isAddingParticipants || isRemovingParticipant}>
            {isAddingParticipants || isRemovingParticipant ? 'Saving...' : 'Save Members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
