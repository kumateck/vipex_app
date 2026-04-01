export type ItSupportTicketAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  url: string;
  sizeBytes: number;
  createdAt: string | null;
};

export type ItSupportTicketsListInput = {
  companyId: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  branchId?: string;
  locationId?: string;
};

export type ItSupportTicketsCreateInput = {
  companyId: string;
  userId: string;
  subject: string;
  description?: string | null;
  priority?: string | null;
  category?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  assignedToUserId?: string | null;
  attachments?: Array<{
    fileName: string;
    dataUrl: string;
  }>;
};

export type ItSupportTicketsUpdateInput = {
  companyId: string;
  userId: string;
  ticketId: string;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  assignedToUserId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  note?: string | null;
};

export type ItSupportTicketNoteCreateInput = {
  companyId: string;
  userId: string;
  ticketId: string;
  note: string;
  canManageTickets?: boolean;
};

export type ItSupportTicketEventItem = {
  id: string;
  ticketId: string;
  eventType: string;
  eventNote: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  performedBy: string | null;
  performedByUserName: string | null;
  createdAt: string | null;
};

export type ItSupportTicketItem = {
  id: string;
  companyId: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  branchId: string | null;
  locationId: string | null;
  requesterUserId: string;
  assignedToUserId: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  attachments: ItSupportTicketAttachment[];
};
