import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type { ParcelAnalyticsQuery } from '../types';
import { useGetParcelAnalyticsDetailsQuery } from '../services';

export function useParcelAnalyticsDetails(query: ParcelAnalyticsQuery) {
  const user = useAuthStore((state) => state.user);
  const viewerKey = `${user?.id}:${user?.company?.id}:${user?.branch?.id}:${user?.branch?.type}`;
  const [page, setPage] = useState(1);
  const result = useGetParcelAnalyticsDetailsQuery({ ...query, page, viewerKey });
  return { page, setPage, ...result, data: result.currentData };
}
