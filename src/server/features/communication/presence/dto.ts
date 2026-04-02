export type CommunicationPresenceListInput = {
  companyId: string;
};

export type CommunicationPresenceCreateInput = {
  companyId: string;
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
};

export type CommunicationPresenceItem = {
  id: string;
  userId: string;
  status: string;
  lastSeenAt: string | null;
  updatedAt: string | null;
};
