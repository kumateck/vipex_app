import { useState } from 'react';
import { useReceiverHandoverList } from './use-receiver-handover-list';

export function useReceiverHandoverSearch(search: string) {
  const [after, setAfter] = useState<string>();
  const state = useReceiverHandoverList(search, after);
  return {
    ...state,
    after,
    firstPage: () => setAfter(undefined),
    nextPage: () => setAfter(state?.page?.next ?? undefined),
  };
}
