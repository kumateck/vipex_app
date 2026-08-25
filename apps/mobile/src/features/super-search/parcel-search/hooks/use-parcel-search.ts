import { useCallback, useState } from 'react';
import { hapticError, hapticTap } from '@mobile/lib/haptics';
import { notifyError } from '@mobile/lib/notify';
import { router } from '@mobile/navigation/router-compat';
import { useAuth } from '@mobile/providers/auth-provider';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { findParcels } from '../services';
import type { ParcelSearchState } from '../types';

export function useParcelSearch(): ParcelSearchState {
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const [query, setQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !companyId || searchBusy) return;
    setSearchBusy(true);
    setSearched(true);
    try {
      const response = await withAuth((token) => findParcels(token, { query: trimmed, companyId }));
      setRows(response.data ?? []);
      void hapticTap();
    } catch (error) {
      notifyError(
        'Search failed',
        error instanceof Error ? error.message : 'Unable to search parcel records.',
      );
      void hapticError();
    } finally {
      setSearchBusy(false);
    }
  }, [companyId, query, searchBusy, withAuth]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setRows([]);
    setSearched(false);
  }, []);

  const openParcel = useCallback((parcel: ParcelSearchRow) => {
    router.push({
      pathname: '/(app)/super-search/[parcelId]',
      params: { parcelId: parcel.id, bookingCode: parcel.bookingCode },
    });
    void hapticTap();
  }, []);

  return {
    query,
    rows,
    searched,
    searchBusy,
    setQuery,
    clearSearch,
    runSearch,
    openParcel,
  };
}
