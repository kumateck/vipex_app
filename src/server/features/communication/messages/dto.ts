export type CommunicationMessagesListInput = {
  companyId: string;
  userId: string;
  threadId: string;
  limit?: number;
};

export type CommunicationMessagesUnreadCountsInput = {
  companyId: string;
  userId: string;
};

export type CommunicationMessagesMarkThreadReadInput = {
  companyId: string;
  userId: string;
  threadId: string;
};

export type CommunicationMeetingsListInput = {
  companyId: string;
  userId: string;
  threadId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type CommunicationMessagesCreateInput = {
  companyId: string;
  userId: string;
  threadId: string;
  body?: string | null;
  messageType?: string | null;
  metadataJson?: Record<string, unknown> | null;
  replyToMessageId?: string | null;
};

export type CommunicationMessagesUpdateInput = {
  companyId: string;
  userId: string;
  id: string;
  body?: string | null;
  metadataJson?: Record<string, unknown> | null;
};

export type CommunicationMessagesDeleteInput = {
  companyId: string;
  userId: string;
  id: string;
};

export type CommunicationMessagesToggleFlagInput = {
  companyId: string;
  userId: string;
  id: string;
  flag: 'pinnedByUserIds' | 'starredByUserIds';
  enabled: boolean;
};

export type CommunicationMessagesToggleReactionInput = {
  companyId: string;
  userId: string;
  id: string;
  emoji: string;
  enabled: boolean;
};

export type CommunicationMessagesItem = {
  id: string;
  threadId: string;
  senderUserId: string | null;
  senderName?: string | null;
  messageType: string;
  body: string | null;
  metadataJson: unknown;
  replyToMessageId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string | null;
};

export type CommunicationMessagesUnreadCountItem = {
  threadId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  lastMessageAt: string | null;
};

export type CommunicationMeetingItem = {
  messageId: string;
  threadId: string;
  threadTitle: string | null;
  threadType: string;
  senderUserId: string | null;
  body: string | null;
  title: string;
  link: string | null;
  startsAt: string | null;
  metadataJson: unknown;
  createdAt: string | null;
};
