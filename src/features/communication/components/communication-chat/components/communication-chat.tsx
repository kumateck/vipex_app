import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCommunicationChatPage } from '../hooks/use-communication-chat-page';
import { ManageChannelMembersDialog } from '../dialogs/manage-channel-members-dialog';
import { CommunicationChatConversationPanel } from './communication-chat-conversation-panel';
import { CommunicationChatWorkspacePanel } from './communication-chat-workspace-panel';

export function CommunicationChat() {
  const viewModel = useCommunicationChatPage();

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Team Chat</h1>
            <p className="text-sm text-muted-foreground">
              Team chat orientation using the existing app appearance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={viewModel.isSocketConnected ? 'default' : 'outline'}>
              {viewModel.isSocketConnected ? 'Socket live' : 'Socket offline'}
            </Badge>
            <Button variant="outline" onClick={viewModel.onRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[60px_370px_minmax(0,1fr)]">
          <CommunicationChatWorkspacePanel
            threadTypeFilter={viewModel.threadTypeFilter}
            onThreadTypeFilterChange={viewModel.setThreadTypeFilter}
            presenceStatus={viewModel.presenceStatus}
            onChangePresence={(value) => {
              void viewModel.onChangePresence(value);
            }}
            presenceRows={viewModel.presenceRows}
            userLabelById={viewModel.userLabelById}
            onOpenWorkspace={viewModel.navigateToWorkspace}
            onOpenCreate={viewModel.navigateToCreate}
          />

          <CommunicationChatConversationPanel viewModel={viewModel} />
        </div>
      </div>

      <ManageChannelMembersDialog
        managingChannel={viewModel.managingChannel}
        onOpenChange={(open) => {
          if (!open) viewModel.setManagingChannel(null);
        }}
        allUserTransferItems={viewModel.allUserTransferItems}
        channelMemberIds={viewModel.channelMemberIds}
        onChannelMemberIdsChange={viewModel.setChannelMemberIds}
        isAddingParticipants={viewModel.isAddingParticipants}
        isRemovingParticipant={viewModel.isRemovingParticipant}
        onSave={() => {
          void viewModel.onSaveChannelMembers();
        }}
      />
    </ScrollableWrapper>
  );
}
