export type CommunicationChannelsListInput = {
  companyId: string;
};

export type CommunicationChannelsCreateInput = {
  companyId: string;
  userId: string;
  name: string;
  description?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  isCallEnabled?: boolean;
  isAnnouncementOnly?: boolean;
};

export type CommunicationChannelsItem = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  name: string;
  description: string | null;
  isCallEnabled: boolean;
  isAnnouncementOnly: boolean;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
