import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationEngagementRequest,
  CommunicationEngagementRequestTarget,
  CommunicationThread,
  MobileUserOption,
} from '@mobile/types/communication';

export type CommunicationTabKey = 'chats' | 'channels' | 'users' | 'requests';

export type CommunicationLoadState = {
  threads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
  users: MobileUserOption[];
  requestTargets: CommunicationEngagementRequestTarget[];
  incomingRequests: CommunicationEngagementRequest[];
  outgoingRequests: CommunicationEngagementRequest[];
  activeCalls: CommunicationCallSession[];
  threadUnreadById: Map<string, { unread: number; mentions: number }>;
  voiceUnreadById: Map<string, { unread: number; mentions: number }>;
};

export type UserChatEntry = {
  id: string;
  fullname: string;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
  thread: CommunicationThread | null;
  requiresRequest: boolean;
  canRequest: boolean;
};
