import { useCallback, useState, type FormEvent } from 'react';
import { usePendingOtpApprovalsQuery } from '@/features/operations/parcel/components/receiver-otp-exception';
import type {
  OtpApprovalQueueItem,
  OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';

export function useOtpApprovalQueue() {
  const [workflow, setWorkflow] = useState<OtpAuthorizationWorkflow>('receiver_cashier');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OtpApprovalQueueItem | null>(null);
  const [approvalMessage, setApprovalMessage] = useState('');
  const query = usePendingOtpApprovalsQuery(
    { workflow, search: search || undefined, page },
    { refetchOnMountOrArgChange: true, pollingInterval: 30_000 },
  );

  function changeWorkflow(value: OtpAuthorizationWorkflow) {
    setWorkflow(value);
    setPage(1);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  const approve = useCallback((message: string) => {
    setSelected(null);
    setApprovalMessage(message);
  }, []);

  const select = useCallback((parcel: OtpApprovalQueueItem) => {
    setApprovalMessage('');
    setSelected(parcel);
  }, []);

  const dismiss = useCallback(() => setSelected(null), []);

  return {
    workflow,
    searchInput,
    setSearchInput,
    page,
    setPage,
    selected,
    approvalMessage,
    query,
    changeWorkflow,
    submitSearch,
    approve,
    select,
    dismiss,
  };
}
