import { useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { listNoteParcels, type NoteQueue } from '../services';

export function useNoteQueue(queue: NoteQueue, allowed: boolean) {
  const { withAuth } = useAuth();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState({ search: '', page: 1 });
  const [result, setResult] = useState<Awaited<ReturnType<typeof listNoteParcels>>>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(allowed);
  useEffect(() => {
    if (!allowed) return;
    let ignore = false;
    setLoading(true);
    setError('');
    void withAuth((token) => listNoteParcels(token, queue, query.search, query.page))
      .then(
        (data) => {
          if (!ignore) setResult(data);
        },
        (failure) => {
          if (!ignore) setError(getMobileErrorMessage(failure, 'Unable to load parcels'));
        },
      )
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [allowed, query, queue, withAuth]);
  return {
    draft,
    setDraft,
    query,
    result,
    error,
    loading,
    search: () => setQuery({ search: draft.trim(), page: 1 }),
    refresh: () => setQuery((current) => ({ ...current })),
    changePage: (page: number) => setQuery((current) => ({ ...current, page })),
  };
}
