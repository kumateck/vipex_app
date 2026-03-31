export type CommunicationGroupsListInput = {
  companyId: string;
};

export type CommunicationGroupsCreateInput = {
  companyId: string;
  userId: string;
  name: string;
  description?: string | null;
  branchId?: string | null;
  locationId?: string | null;
};

export type CommunicationGroupsItem = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  name: string;
  description: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
