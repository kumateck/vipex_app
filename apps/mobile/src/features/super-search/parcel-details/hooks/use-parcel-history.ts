import { useCallback, useEffect, useState } from 'react';
import { getParcelHistory } from '@mobile/lib/api';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import type { ParcelHistoryEvent } from '@mobile/types/parcels';

type WithAuth = <T>(cb: (token: string) => Promise<T>) => Promise<T>;

/** Loads the parcel's who-did-what timeline; a failure here never blocks the details screen. */
export function useParcelHistory({
  parcelId,
  withAuth,
}: {
  parcelId?: string;
  withAuth: WithAuth;
}) {
  const [events, setEvents] = useState<ParcelHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    try {
      setEvents(await withAuth((token) => getParcelHistory(token, parcelId)));
    } catch (err) {
      setError(getMobileErrorMessage(err, 'Unable to load parcel history.'));
    } finally {
      setLoading(false);
    }
  }, [parcelId, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, reload: load };
}
