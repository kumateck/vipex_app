export type ChatContact = {
  id: string;
  fullname: string;
  initials: string;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
  threadId: string | null;
  lastMessageAt: string | null;
  draftMessage: string | null;
  unreadCount: number;
  mentionCount: number;
  isOnline: boolean;
  isTyping: boolean;
  requiresRequest: boolean;
};
