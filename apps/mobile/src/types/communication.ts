export type CommunicationThread = {
  id: string;
  threadType: 'direct' | 'group' | 'channel' | string;
  title: string | null;
  participantCount?: number;
  lastMessageAt: string | null;
};

export type CommunicationChannel = {
  id: string;
  companyId?: string;
  branchId?: string | null;
  locationId?: string | null;
  name: string;
  description: string | null;
  channelType: 'text' | 'voice' | string;
  visibility: 'public' | 'private' | string;
  isCallEnabled: boolean;
  isAnnouncementOnly?: boolean;
  threadId: string | null;
  maxParticipants?: number | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?: string | null;
  participantCount: number;
};

export type CommunicationMessage = {
  id: string;
  threadId: string;
  senderUserId: string | null;
  messageType: string;
  body: string | null;
  metadataJson: unknown;
  createdAt: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
};

export type CommunicationUnreadCount = {
  threadId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  lastMessageAt: string | null;
};

export type CommunicationChannelUnreadCount = {
  channelId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  latestActivityAt: string | null;
};

export type CommunicationCallSession = {
  id: string;
  channelId: string | null;
  threadId: string | null;
  callType: string;
  status: string;
  livekitRoomName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunicationLivekitToken = {
  callId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
  expiresAt: string;
};

export type CommunicationVoiceJoin = {
  call: CommunicationCallSession;
  livekit: CommunicationLivekitToken;
};

export type MobileUserOption = {
  id: string;
  email: string;
  fullname: string;
};
