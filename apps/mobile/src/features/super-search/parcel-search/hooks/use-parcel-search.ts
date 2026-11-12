import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  const lastSearch = useRef('');

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !companyId || searchBusy) return;
    lastSearch.current = trimmed;
    setSearchBusy(true);
    setSearched(true);
    try {
      const response = await withAuth((token) => findParcels(token, { query: trimmed, companyId }));
      if (lastSearch.current === trimmed) setRows(response.data ?? []);
      void hapticTap();
    } catch (error) {
      notifyError(
        'Search failed',
        getMobileErrorMessage(error, '') || 'Unable to search parcel records.',
      );
      void hapticError();
    } finally {
      setSearchBusy(false);
    }
  }, [companyId, query, searchBusy, withAuth]);

  useFocusEffect(
    useCallback(() => {
      const term = lastSearch.current;
      if (!term || !companyId) return;
      let focused = true;
      void withAuth((token) => findParcels(token, { query: term, companyId })).then(
        (result) => {
          if (focused && lastSearch.current === term) setRows(result.data ?? []);
        },
        () => {
          if (focused && lastSearch.current === term) {
            setRows([]);
            notifyError('Refresh failed', 'Search again to get the current pickup office.');
          }
        },
      );
      return () => {
        focused = false;
      };
    }, [companyId, withAuth]),
  );

  const clearSearch = useCallback(() => {
    lastSearch.current = '';
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
