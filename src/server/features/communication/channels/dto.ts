export type CommunicationChannelsListInput = {
  companyId: string;
  userId: string;
  channelType?: 'text' | 'voice';
  includeArchived?: boolean;
};

export type CommunicationChannelsCreateInput = {
  companyId: string;
  userId: string;
  name: string;
  description?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  channelType: 'text' | 'voice';
  visibility: 'public' | 'private';
  participantUserIds?: string[];
  isCallEnabled?: boolean;
  isAnnouncementOnly?: boolean;
  maxParticipants?: number | null;
};

export type CommunicationChannelsUpdateInput = {
  companyId: string;
  userId: string;
  id: string;
  name?: string;
  description?: string | null;
  isArchived?: boolean;
  isCallEnabled?: boolean;
  isAnnouncementOnly?: boolean;
  maxParticipants?: number | null;
};

export type CommunicationChannelsParticipantsInput = {
  companyId: string;
  userId: string;
  id: string;
  participantUserIds: string[];
};

export type CommunicationChannelsRemoveParticipantInput = {
  companyId: string;
  userId: string;
  id: string;
  participantUserId: string;
};

export type CommunicationChannelsGetByIdInput = {
  companyId: string;
  userId: string;
  id: string;
};

export type CommunicationChannelsUnreadCountsInput = {
  companyId: string;
  userId: string;
  channelType?: 'text' | 'voice';
};

export type CommunicationChannelsMarkReadInput = {
  companyId: string;
  userId: string;
  id: string;
};

export type CommunicationChannelsItem = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  name: string;
  description: string | null;
  channelType: string;
  visibility: string;
  isCallEnabled: boolean;
  isAnnouncementOnly: boolean;
  threadId: string | null;
  maxParticipants: number | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participantCount: number;
  participantUserIds?: string[];
};

export type CommunicationChannelsUnreadCountItem = {
  channelId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  latestActivityAt: string | null;
};
