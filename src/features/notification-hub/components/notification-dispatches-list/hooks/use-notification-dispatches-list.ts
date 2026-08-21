import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type NotificationDispatch,
  useListNotificationDispatchesQuery,
  useRetryNotificationDispatchMutation,
} from '../../../api/notification-hub.api';
import { getNotificationDispatchErrorMessage } from '../utils/notification-dispatch-error';

const EMPTY_DISPATCHES: NotificationDispatch[] = [];

export function useNotificationDispatchesList() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedDispatch, setSelectedDispatch] = useState<NotificationDispatch | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearch(searchInput), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        channel: channel === 'all' ? undefined : channel,
        status: status === 'all' ? undefined : status,
      },
    }),
    [page, search, channel, status],
  );

  const { data, isLoading } = useListNotificationDispatchesQuery(query);
  const [retryDispatch, { isLoading: isRetrying }] = useRetryNotificationDispatchMutation();

  const onRetry = useCallback(
    async (id: string) => {
      try {
        await retryDispatch({ id }).unwrap();
        toast.success('Dispatch retry triggered');
      } catch (error) {
        toast.error(getNotificationDispatchErrorMessage(error));
      }
    },
    [retryDispatch],
  );

  const onSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
    setPage(1);
  }, []);
  const onChannelChange = useCallback((value: string) => {
    setChannel(value);
    setPage(1);
  }, []);
  const onStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);
  const onView = useCallback((dispatch: NotificationDispatch) => setSelectedDispatch(dispatch), []);
  const onCloseDetails = useCallback(() => setSelectedDispatch(null), []);
  const onPreviousPage = useCallback(() => setPage((current) => current - 1), []);
  const onNextPage = useCallback(() => setPage((current) => current + 1), []);

  return {
    searchInput,
    channel,
    status,
    rows: data?.data ?? EMPTY_DISPATCHES,
    page: data?.meta?.page ?? 1,
    totalPages: data?.meta?.totalPages ?? 1,
    isLoading,
    isRetrying,
    selectedDispatch,
    onSearchInputChange,
    onChannelChange,
    onStatusChange,
    onView,
    onRetry,
    onCloseDetails,
    onPreviousPage,
    onNextPage,
  };
}
