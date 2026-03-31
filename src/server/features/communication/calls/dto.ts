export type CommunicationCallsListInput = {
  companyId: string;
  threadId?: string;
  channelId?: string;
  status?: string;
};

export type CommunicationCallsCreateInput = {
  companyId: string;
  userId: string;
  threadId?: string | null;
  channelId?: string | null;
  callType?: 'audio' | 'video';
  livekitRoomName?: string | null;
};

export type CommunicationCallsItem = {
  id: string;
  companyId: string;
  threadId: string | null;
  channelId: string | null;
  initiatorUserId: string | null;
  callType: string;
  status: string;
  livekitRoomName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
