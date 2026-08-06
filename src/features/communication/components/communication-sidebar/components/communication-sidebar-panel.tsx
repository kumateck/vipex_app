import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { CommunicationRequestChatDialog } from './communication-request-chat-dialog';
import { CommunicationRequestsPanel } from './communication-requests-panel';
import { CommunicationContactListPanel } from './communication-contact-list-panel';
import { useCommunicationSidebar } from '../hooks/use-communication-sidebar';

function SectionHeader({ title, onCreate }: { title: string; onCreate: () => void }) {
  return (
    <div className="mb-1 flex items-center justify-between px-2 py-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onCreate}
        aria-label={`Create ${title}`}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChannelRowSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

type CommunicationSidebarPanelProps = {
  activeTab: 'chats' | 'channels' | 'colleagues' | 'requests';
};

export function CommunicationSidebarPanel({ activeTab }: CommunicationSidebarPanelProps) {
  const location = useLocation();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [defaultRequestTargetId, setDefaultRequestTargetId] = useState<string | null>(null);
  const {
    chatContacts,
    colleagueContacts,
    requestTargets,
    incomingRequests,
    outgoingRequests,
    textChannels,
    voiceChannels,
    activeCalls,
    isLoadingUsers,
    isLoadingRequestTargets,
    isLoadingIncomingRequests,
    isLoadingOutgoingRequests,
    isLoadingTextChannels,
    isLoadingVoiceChannels,
    joiningVoiceChannelId,
    startingUserId,
    isCreatingRequest,
    isApprovingRequest,
    isDecliningRequest,
    startDirectChat,
    requestDirectChat,
    approveChatRequest,
    declineChatRequest,
    openTextChannel,
    openVoiceChannel,
    openCreateChannel,
  } = useCommunicationSidebar();

  const openRequestDialog = (targetUserId?: string) => {
    setDefaultRequestTargetId(targetUserId ?? null);
    setIsRequestDialogOpen(true);
  };

  if (activeTab === 'requests') {
    return (
      <div className="flex h-full min-w-0 flex-col p-2 px-1">
        <CommunicationRequestsPanel
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          isLoadingIncomingRequests={isLoadingIncomingRequests}
          isLoadingOutgoingRequests={isLoadingOutgoingRequests}
          isApprovingRequest={isApprovingRequest}
          isDecliningRequest={isDecliningRequest}
          onApproveRequest={approveChatRequest}
          onDeclineRequest={declineChatRequest}
        />
      </div>
    );
  }

  if (activeTab === 'chats' || activeTab === 'colleagues') {
    return (
      <div className="flex h-full min-w-0 flex-col p-2 px-1">
        <CommunicationContactListPanel
          mode={activeTab}
          contacts={activeTab === 'chats' ? chatContacts : colleagueContacts}
          isLoadingUsers={isLoadingUsers}
          startingUserId={startingUserId}
          onOpenRequestDialog={openRequestDialog}
          onContactSelect={async (contact) => {
            if (activeTab === 'colleagues' && contact.requiresRequest) {
              openRequestDialog(contact.id);
              return;
            }
            await startDirectChat({ id: contact.id, fullname: contact.fullname });
          }}
        />
        <CommunicationRequestChatDialog
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          targets={requestTargets}
          isLoadingTargets={isLoadingRequestTargets}
          isSubmitting={isCreatingRequest}
          defaultTargetUserId={defaultRequestTargetId}
          onSubmit={async ({ targetUserId, reasonNote }) => {
            await requestDirectChat({ targetUserId, reasonNote });
            setIsRequestDialogOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-3 overflow-y-auto p-2 pr-1">
      <SidebarGroup className="p-0">
        <SectionHeader title="Text Channels" onCreate={() => openCreateChannel('text')} />
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoadingTextChannels ? (
              <>
                <ChannelRowSkeleton />
                <ChannelRowSkeleton />
                <ChannelRowSkeleton />
              </>
            ) : null}
            {!isLoadingTextChannels && !textChannels.length ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">No text channels yet.</p>
            ) : null}
            {textChannels.map((channel) => {
              const isActive =
                !!channel.threadId &&
                location.pathname === `/communication/chat/${channel.threadId}`;
              return (
                <SidebarMenuItem key={channel.id}>
                  <SidebarMenuButton
                    type="button"
                    onClick={() => openTextChannel(channel.threadId)}
                    isActive={isActive}
                  >
                    <Icon name="Hash" className="h-4 w-4" />
                    <span className="truncate">{channel.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="p-0">
        <SectionHeader title="Voice Channels" onCreate={() => openCreateChannel('voice')} />
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoadingVoiceChannels ? (
              <>
                <ChannelRowSkeleton />
                <ChannelRowSkeleton />
                <ChannelRowSkeleton />
              </>
            ) : null}
            {!isLoadingVoiceChannels && !voiceChannels.length ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">No voice channels yet.</p>
            ) : null}
            {voiceChannels.map((channel) => {
              const activeCallForChannel = activeCalls.find(
                (call) => call.channelId === channel.id,
              );
              const isActive =
                !!activeCallForChannel &&
                location.pathname === `/communication/calls/${activeCallForChannel.id}`;
              return (
                <SidebarMenuItem key={channel.id}>
                  <SidebarMenuButton
                    type="button"
                    onClick={() => void openVoiceChannel(channel.id)}
                    disabled={joiningVoiceChannelId === channel.id}
                    isActive={isActive}
                    className={cn('h-8')}
                  >
                    <Icon name="Volume2" className="h-4 w-4" />
                    <span className="truncate">
                      {joiningVoiceChannelId === channel.id ? 'Joining...' : channel.name}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
