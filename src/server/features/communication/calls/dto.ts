export type CommunicationCallsListInput = {
  companyId: string;
  userId: string;
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

export type CommunicationCallsUpdateStatusInput = {
  companyId: string;
  userId: string;
  id: string;
  status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled';
};

export type CommunicationCallsCreateLivekitTokenInput = {
  companyId: string;
  userId: string;
  id: string;
  requestOrigin?: string | null;
};

export type CommunicationCallsLivekitTokenItem = {
  callId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
  expiresAt: string;
};

export type CommunicationVoiceJoinInput = {
  companyId: string;
  userId: string;
  channelId: string;
  requestOrigin?: string | null;
};

export type CommunicationVoiceJoinItem = {
  call: CommunicationCallsItem;
  livekit: CommunicationCallsLivekitTokenItem;
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
