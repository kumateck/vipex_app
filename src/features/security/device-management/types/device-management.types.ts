export type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'blocked' | 'permanently_denied';

export type ReviewAction = 'approve' | 'revoke' | 'block' | 'unblock' | 'permanently_deny';

export type RegisteredDevice = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  kind: 'mobile' | 'desktop';
  status: DeviceStatus;
  deviceName: string;
  model: string | null;
  osName: string;
  osVersion: string | null;
  appVersion: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
  lastSeenAt: string | null;
};
