import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useAuthStore } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useUpdateCustomerMessageMutation } from '../services/api';
import type { CustomerMessage, MessageStatus } from '../types';

export function useMessageHandling(message: CustomerMessage) {
  const [status, setStatus] = useState<MessageStatus>(message.status);
  const [note, setNote] = useState('');
  const [update, { isLoading }] = useUpdateCustomerMessageMutation();
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(PermissionKeys.CanManageCustomerMessages) ?? false,
  );
  const save = async () => {
    if (!canManage || isLoading) return;
    try {
      await update({
        id: message.id,
        updatedAt: message.updatedAt,
        status,
        note: note.trim() || undefined,
      }).unwrap();
      toast.success('Customer message updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save. Refresh the message and try again.'));
    }
  };
  return { status, setStatus, note, setNote, isLoading, canManage, save };
}
