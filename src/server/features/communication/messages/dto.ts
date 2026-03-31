export type CommunicationMessagesListInput = {
  companyId: string;
  userId: string;
  threadId: string;
  limit?: number;
};

export type CommunicationMessagesCreateInput = {
  companyId: string;
  userId: string;
  threadId: string;
  body?: string | null;
  messageType?: string | null;
  metadataJson?: Record<string, unknown> | null;
};

export type CommunicationMessagesItem = {
  id: string;
  threadId: string;
  senderUserId: string | null;
  messageType: string;
  body: string | null;
  metadataJson: unknown;
  createdAt: string | null;
};
