import type { DeviceStatus, ReviewAction } from '../types/device-management.types';

export function availableDeviceActions(status: DeviceStatus): ReviewAction[] {
  if (status === 'pending' || status === 'revoked') return ['approve', 'block', 'permanently_deny'];
  if (status === 'approved') return ['revoke', 'block', 'permanently_deny'];
  if (status === 'blocked') return ['unblock', 'permanently_deny'];
  return [];
}

export function actionLabel(action: ReviewAction) {
  return {
    approve: 'Approve',
    revoke: 'Revoke approval',
    block: 'Block',
    unblock: 'Unblock to pending',
    permanently_deny: 'Permanently prevent',
  }[action];
}
