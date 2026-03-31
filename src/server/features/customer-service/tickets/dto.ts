export type CustomerServiceTicketsListInput = {
  companyId: string;
  status?: string;
  priority?: string;
};

export type CustomerServiceTicketsCreateInput = {
  companyId: string;
  userId: string;
  conversationId?: string | null;
  channel?: string | null;
  priority?: string | null;
  subject?: string | null;
  description?: string | null;
  trackingCode?: string | null;
  bookingCode?: string | null;
  parcelId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
};

export type CustomerServiceTicketsItem = {
  id: string;
  companyId: string;
  conversationId: string | null;
  status: string;
  priority: string;
  channel: string;
  subject: string | null;
  description: string | null;
  trackingCode: string | null;
  bookingCode: string | null;
  parcelId: string | null;
  ownerUserId: string | null;
  ownerQueue: string | null;
  branchId: string | null;
  locationId: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
