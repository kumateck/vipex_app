import { mobileApiGet } from '@mobile/lib/api';
import type { RiderDailyAnalytics } from '../types';

function todayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRiderDailyAnalytics(accessToken: string, date = todayDateKey()) {
  return mobileApiGet<RiderDailyAnalytics>({
    path: '/deliveries/dd/rider/daily-analytics',
    token: accessToken,
    query: { date },
  });
}
