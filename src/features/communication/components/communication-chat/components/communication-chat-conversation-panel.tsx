import { Hash, MessageSquareText, Users2, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommunicationChatViewModel } from '../types/communication-chat.types';
import {
  ChannelListItem,
  SectionHeader,
  ThreadListItem,
  VoiceChannelListItem,
} from './communication-chat-list-items';

type CommunicationChatConversationPanelProps = {
  viewModel: CommunicationChatViewModel;
};

export function CommunicationChatConversationPanel({
  viewModel,
}: CommunicationChatConversationPanelProps) {
  const {
    openSections,
    toggleSection,
    isLoadingThreads,
    directThreads,
    groupThreads,
    selectedThreadId,
    unreadByThreadId,
    mentionsByThreadId,
    navigateToThread,
    isLoadingTextChannels,
    textChannels,
    isLoadingVoiceChannels,
    voiceChannels,
    activeCallByChannelId,
    callParticipantsByCallId,
    userLabelById,
    joiningVoiceChannelId,
    selectedCallId,
    voiceUnreadByChannelId,
    voiceMentionsByChannelId,
    onJoinVoiceChannel,
    setManagingChannel,
  } = viewModel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="space-y-2">
          <SectionHeader
            title="DMs"
            icon={<MessageSquareText className="h-3.5 w-3.5" />}
            isOpen={openSections.dms}
            onToggle={() => toggleSection('dms')}
          />
          {openSections.dms ? (
            isLoadingThreads ? (
              <p className="text-sm text-muted-foreground">Loading direct chats...</p>
            ) : directThreads.length ? (
              directThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  icon="dm"
                  isActive={selectedThreadId === thread.id}
                  unreadCount={
                    selectedThreadId === thread.id ? 0 : (unreadByThreadId.get(thread.id) ?? 0)
                  }
                  mentionCount={
                    selectedThreadId === thread.id ? 0 : (mentionsByThreadId.get(thread.id) ?? 0)
                  }
                  onClick={() => navigateToThread(thread.id)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No direct chats yet.</p>
            )
          ) : null}
        </div>

        <div className="space-y-2">
          <SectionHeader
            title="Groups"
            icon={<Users2 className="h-3.5 w-3.5" />}
            isOpen={openSections.groups}
            onToggle={() => toggleSection('groups')}
          />
          {openSections.groups ? (
            isLoadingThreads ? (
              <p className="text-sm text-muted-foreground">Loading groups...</p>
            ) : groupThreads.length ? (
              groupThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  icon="group"
                  isActive={selectedThreadId === thread.id}
                  unreadCount={
                    selectedThreadId === thread.id ? 0 : (unreadByThreadId.get(thread.id) ?? 0)
                  }
                  mentionCount={
                    selectedThreadId === thread.id ? 0 : (mentionsByThreadId.get(thread.id) ?? 0)
                  }
                  onClick={() => navigateToThread(thread.id)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No groups yet.</p>
            )
          ) : null}
        </div>

        <div className="space-y-2">
          <SectionHeader
            title="Text Channels"
            icon={<Hash className="h-3.5 w-3.5" />}
            isOpen={openSections.text}
            onToggle={() => toggleSection('text')}
          />
          {openSections.text ? (
            isLoadingTextChannels ? (
              <p className="text-sm text-muted-foreground">Loading text channels...</p>
            ) : textChannels.length ? (
              textChannels.map((channel) => (
                <ChannelListItem
                  key={channel.id}
                  channel={channel}
                  isActive={Boolean(channel.threadId && selectedThreadId === channel.threadId)}
                  unreadCount={
                    channel.threadId && selectedThreadId !== channel.threadId
                      ? (unreadByThreadId.get(channel.threadId) ?? 0)
                      : 0
                  }
                  mentionCount={
                    channel.threadId && selectedThreadId !== channel.threadId
                      ? (mentionsByThreadId.get(channel.threadId) ?? 0)
                      : 0
                  }
                  onOpen={() => {
                    if (!channel.threadId) return;
                    navigateToThread(channel.threadId);
                  }}
                  onManageMembers={() => setManagingChannel(channel)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No text channels yet.</p>
            )
          ) : null}
        </div>

        <div className="space-y-2">
          <SectionHeader
            title="Voice Channels"
            icon={<Volume2 className="h-3.5 w-3.5" />}
            isOpen={openSections.voice}
            onToggle={() => toggleSection('voice')}
          />
          {openSections.voice ? (
            isLoadingVoiceChannels ? (
              <p className="text-sm text-muted-foreground">Loading voice channels...</p>
            ) : voiceChannels.length ? (
              voiceChannels.map((channel) => {
                const activeCall = activeCallByChannelId.get(channel.id) ?? null;
                const participantInfo = activeCall
                  ? callParticipantsByCallId[activeCall.id]
                  : undefined;
                const participantCount = participantInfo?.participants.length ?? 0;
                const participants = (participantInfo?.participants ?? [])
                  .slice(0, 3)
                  .map((participant) => ({
                    label: userLabelById.get(participant.userId) ?? participant.userId,
                    isMuted: participant.isMuted,
                    isVideoOff: participant.isVideoOff,
                  }));
                return (
                  <VoiceChannelListItem
                    key={channel.id}
                    channel={channel}
                    activeCall={activeCall}
                    participantCount={participantCount}
                    participants={participants}
                    isJoining={joiningVoiceChannelId === channel.id}
                    isActive={Boolean(activeCall && selectedCallId === activeCall.id)}
                    unreadCount={
                      activeCall && selectedCallId === activeCall.id
                        ? 0
                        : (voiceUnreadByChannelId.get(channel.id) ?? 0)
                    }
                    mentionCount={
                      activeCall && selectedCallId === activeCall.id
                        ? 0
                        : (voiceMentionsByChannelId.get(channel.id) ?? 0)
                    }
                    onJoin={() => void onJoinVoiceChannel(channel)}
                    onManageMembers={() => setManagingChannel(channel)}
                  />
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No voice channels yet.</p>
            )
          ) : null}
        </div>

        <p>Pick a DM, group, or text channel from the list above to open conversation detail.</p>
        <p>
          Voice channels are always available. Click{' '}
          <span className="font-medium text-foreground">Join Voice</span> to enter instantly.
        </p>
        {selectedThreadId ? (
          <p>
            Current thread: <span className="font-medium text-foreground">{selectedThreadId}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
