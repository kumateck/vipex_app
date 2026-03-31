export type CustomerServiceConversationsListInput = {
  companyId: string;
};

export type CustomerServiceConversationsCreateInput = {
  companyId: string;
  userId: string;
  customerId?: string | null;
  channel?: string | null;
  branchId?: string | null;
  locationId?: string | null;
};

export type CustomerServiceConversationsItem = {
  id: string;
  companyId: string;
  customerId: string | null;
  ticketId: string | null;
  channel: string;
  branchId: string | null;
  locationId: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
