export type CommunicationEngagementRequestsListInput = {
  companyId: string;
  userId: string;
  view?: 'incoming' | 'outgoing' | 'all';
  status?: 'pending' | 'approved' | 'declined';
};

export type CommunicationEngagementRequestsCreateInput = {
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
  reasonCode?: string | null;
  reasonNote?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  scope?: 'temporary' | 'persistent';
  expiresAt?: string | null;
};

export type CommunicationEngagementRequestsItem = {
  id: string;
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
  status: string;
  reasonCode: string | null;
  reasonNote: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  scope: string;
  approvedBy: string | null;
  approvedAt: string | null;
  declinedBy: string | null;
  declinedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  requesterFullname?: string | null;
  requesterRoleName?: string | null;
  requesterBranchName?: string | null;
  requesterLocationName?: string | null;
  targetFullname?: string | null;
  targetRoleName?: string | null;
  targetBranchName?: string | null;
  targetLocationName?: string | null;
};

export type CommunicationEngagementRequestsDecideInput = {
  id: string;
  companyId: string;
  actingUserId: string;
  approve: boolean;
};

export type CommunicationEngagementRequestTargetItem = {
  id: string;
  fullname: string;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
};
