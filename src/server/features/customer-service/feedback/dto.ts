export type CustomerServiceFeedbackListInput = {
  companyId: string;
  ticketId?: string;
};

export type CustomerServiceFeedbackCreateInput = {
  companyId: string;
  ticketId: string;
  customerId?: string | null;
  score: number;
  comment?: string | null;
};

export type CustomerServiceFeedbackItem = {
  id: string;
  companyId: string;
  ticketId: string;
  customerId: string | null;
  score: number;
  comment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
