import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationPresence,
  CommunicationThread,
} from '../../../api/communication.api';

export const THREAD_TYPES = ['all', 'direct', 'group', 'channel'] as const;

export type ThreadTypeFilter = (typeof THREAD_TYPES)[number];
export type ThreadTypeCreate = Exclude<ThreadTypeFilter, 'all'>;

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export type ChannelParticipantPreview = {
  label: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

export type UserTransferItem = {
  id: string;
  label: string;
  subLabel?: string;
};

export type ConversationOpenSections = {
  dms: boolean;
  groups: boolean;
  text: boolean;
  voice: boolean;
};

export type CommunicationChatViewModel = {
  isSocketConnected: boolean;
  threadTypeFilter: ThreadTypeFilter;
  setThreadTypeFilter: (value: ThreadTypeFilter) => void;
  presenceStatus: PresenceStatus;
  onChangePresence: (value: string) => Promise<void>;
  presenceRows: CommunicationPresence[];
  openSections: ConversationOpenSections;
  toggleSection: (key: keyof ConversationOpenSections) => void;
  directThreads: CommunicationThread[];
  groupThreads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
  isLoadingThreads: boolean;
  isLoadingTextChannels: boolean;
  isLoadingVoiceChannels: boolean;
  selectedThreadId: string | null;
  selectedCallId: string | null;
  unreadByThreadId: Map<string, number>;
  mentionsByThreadId: Map<string, number>;
  voiceUnreadByChannelId: Map<string, number>;
  voiceMentionsByChannelId: Map<string, number>;
  activeCallByChannelId: Map<string, CommunicationCallSession>;
  callParticipantsByCallId: Record<
    string,
    {
      participants: Array<{ userId: string; isMuted: boolean; isVideoOff: boolean }>;
    }
  >;
  joiningVoiceChannelId: string | null;
  userLabelById: Map<string, string>;
  onJoinVoiceChannel: (channel: CommunicationChannel) => Promise<void>;
  onRefresh: () => void;
  navigateToWorkspace: () => void;
  navigateToCreate: () => void;
  navigateToThread: (threadId: string) => void;
  managingChannel: CommunicationChannel | null;
  setManagingChannel: (channel: CommunicationChannel | null) => void;
  channelMemberIds: string[];
  setChannelMemberIds: (ids: string[]) => void;
  allUserTransferItems: UserTransferItem[];
  onSaveChannelMembers: () => Promise<void>;
  isAddingParticipants: boolean;
  isRemovingParticipant: boolean;
};
