import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  useAssignSessionDelegateMutation,
  useGetSessionDelegatesQuery,
  useRevokeSessionDelegateMutation,
} from '../api/cashiers.api';

export function useSessionDelegates(sessionId: string, open: boolean) {
  const [userId, setUserId] = useState('');
  const { data, isLoading } = useGetSessionDelegatesQuery(sessionId, { skip: !open || !sessionId });
  const [assign, { isLoading: assigning }] = useAssignSessionDelegateMutation();
  const [revoke, { isLoading: revoking }] = useRevokeSessionDelegateMutation();
  const assignedIds = new Set(data?.assigned.map((person) => person.userId));
  const available = data?.eligible.filter((person) => !assignedIds.has(person.id)) ?? [];

  const add = async () => {
    if (!userId) return;
    try {
      await assign({ sessionId, userId }).unwrap();
      setUserId('');
      toast.success('Delegate added to this session');
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not add delegate');
    }
  };
  const remove = async (selectedId: string) => {
    try {
      await revoke({ sessionId, userId: selectedId }).unwrap();
      toast.success('Delegate removed');
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not remove delegate');
    }
  };
  return { data, available, isLoading, assigning, revoking, userId, setUserId, add, remove };
}
