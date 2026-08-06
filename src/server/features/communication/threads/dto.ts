export type CommunicationThreadsListInput = {
  companyId: string;
  userId: string;
  threadType?: string | null;
};

export type CommunicationThreadsCreateInput = {
  companyId: string;
  userId: string;
  threadType: 'direct' | 'group' | 'channel';
  title?: string | null;
  participantUserIds: string[];
  branchId?: string | null;
  locationId?: string | null;
};

export type CommunicationThreadsItem = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  threadType: string;
  title: string | null;
  isPrivate: boolean;
  lastMessageAt: string | null;
  createdAt: string | null;
  participantCount?: number;
  directPeerUserId?: string | null;
};
