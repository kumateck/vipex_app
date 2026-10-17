export const MESSAGE_STATUSES = ['new', 'in_progress', 'resolved', 'spam'] as const;
export const MESSAGE_TYPES = ['enquiry', 'complaint', 'feedback'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type CustomerMessage = {
  id: string;
  reference: string;
  type: MessageType;
  name: string;
  phone: string;
  email: string | null;
  branch: string | null;
  trackingCode: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
};
export type MessageEvent = {
  id: string;
  fromStatus: MessageStatus | null;
  toStatus: MessageStatus;
  note: string | null;
  createdAt: string;
};
export type MessageDetail = CustomerMessage & { events: MessageEvent[] };
export type InboxQuery = {
  page: number;
  pageSize: number;
  type?: MessageType;
  status?: MessageStatus;
};
export const messageLabel = (value: string) => value.replace(/_/g, ' ');
