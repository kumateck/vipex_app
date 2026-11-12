import { mobileApiGet } from '@mobile/lib/api';
import type { CustomerLookupResult } from '@mobile/types/booking';

export function findNonIndividualSenders(token: string, telephone: string) {
  return mobileApiGet<CustomerLookupResult[]>({
    path: `/customers/lookup/booking-by-telephone/${encodeURIComponent(telephone)}`,
    query: { nonIndividualOnly: true },
    token,
  });
}
