import { useCallback, useState } from 'react';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useListCustomerMessagesQuery } from '../services/api';
import type { MessageStatus, MessageType } from '../types';

export function useCustomerInbox() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<MessageType | ''>('');
  const [status, setStatus] = useState<MessageStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canRead = useAuthStore(
    (state) => state.user?.permissions?.includes(PermissionKeys.CanReadCustomerMessages) ?? false,
  );
  const result = useListCustomerMessagesQuery(
    { page, pageSize: 25, type: type || undefined, status: status || undefined },
    { skip: !canRead, refetchOnMountOrArgChange: true },
  );
  const changeType = useCallback((value: MessageType | '') => {
    setType(value);
    setPage(1);
    setSelectedId(null);
  }, []);
  const changeStatus = useCallback((value: MessageStatus | '') => {
    setStatus(value);
    setPage(1);
    setSelectedId(null);
  }, []);
  return {
    ...result,
    data: result.currentData,
    canRead,
    page,
    setPage,
    type,
    status,
    selectedId,
    setSelectedId,
    changeType,
    changeStatus,
  };
}
