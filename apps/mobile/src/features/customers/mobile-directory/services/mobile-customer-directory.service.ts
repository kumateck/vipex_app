import { mobileApiGet, updateCustomer } from '@mobile/lib/api';
import type { MobileCustomer, MobileCustomerPatch } from '../types';

export function listMobileCustomers(token: string, search: string) {
  return mobileApiGet<{ data: MobileCustomer[] }>({
    path: '/customers',
    token,
    query: { page: 1, pageSize: 50, search: search.trim() || undefined },
  });
}

export const updateMobileCustomer = (token: string, patch: MobileCustomerPatch) =>
  updateCustomer(token, patch);
