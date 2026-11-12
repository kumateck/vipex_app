import { mobileApiGet } from '@mobile/lib/api';
import type { BranchSwitchOptions } from '@/shared/auth/branch-switch';

export function getBranchSwitchOptions(token: string) {
  return mobileApiGet<BranchSwitchOptions>({ path: '/auth/me/branch-options', token });
}
