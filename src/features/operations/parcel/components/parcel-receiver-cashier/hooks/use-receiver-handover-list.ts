import { useEffect, useState } from 'react';
import type {
  ReceiverHandoverPage,
  ReceiverHandoverWatchKey,
} from '@/shared/shipments/receiver-cashier-signature';
import { useWatchReceiverHandoversMutation } from '../services';

export function useReceiverHandoverList(
  search: string,
  after?: string,
  pending?: ReceiverHandoverWatchKey,
) {
  const { parcelId, handoverId } = pending ?? {};
  const [watch] = useWatchReceiverHandoversMutation({ selectFromResult: () => ({}) });
  const key = JSON.stringify([search, after, parcelId, handoverId]);
  const [state, setState] = useState<{
    key: string;
    page?: ReceiverHandoverPage;
    failed?: boolean;
  }>();

  useEffect(() => {
    let stopped = false;
    let revision: string | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let current: ReturnType<typeof watch> | undefined;
    const refresh = async () => {
      current = watch({
        search: search || undefined,
        after,
        parcelId,
        handoverId,
        since: revision,
      });
      try {
        const page = await current.unwrap();
        if (stopped) return;
        revision = page.revision;
        setState({ key, page });
        retry = setTimeout(() => void refresh(), 250);
      } catch {
        if (stopped) return;
        setState((previous) => ({
          key,
          page: previous?.key === key ? previous.page : undefined,
          failed: true,
        }));
        retry = setTimeout(() => void refresh(), 3_000);
      }
    };
    void refresh();
    return () => {
      stopped = true;
      current?.abort();
      if (retry) clearTimeout(retry);
    };
  }, [after, handoverId, key, parcelId, search, watch]);

  return state?.key === key ? state : undefined;
}
