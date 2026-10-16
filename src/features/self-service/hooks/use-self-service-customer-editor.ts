import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  type SelfServiceDraft,
  useUpdateSelfServiceDraftCustomersMutation,
} from '../api/self-service-agent.api';

type Contact = { fullname: string; phone: string; phone2: string };
export function useSelfServiceCustomerEditor(draft: SelfServiceDraft, onClose: () => void) {
  const [sender, setSender] = useState<Contact>(() => ({
    fullname: draft.senderFullname,
    phone: draft.senderPhone,
    phone2: draft.senderPhone2 ?? '',
  }));
  const [receiver, setReceiver] = useState<Contact>(() => ({
    fullname: draft.receiverFullname,
    phone: draft.receiverPhone,
    phone2: draft.receiverPhone2 ?? '',
  }));
  const [save, { isLoading: isSaving }] = useUpdateSelfServiceDraftCustomersMutation();
  const onChange = (role: 'sender' | 'receiver', field: keyof Contact, value: string) =>
    (role === 'sender' ? setSender : setReceiver)((current) => ({ ...current, [field]: value }));
  const onSave = async () => {
    if (isSaving) return;
    try {
      await save({
        id: draft.id,
        expectedUpdatedAt: draft.updatedAt,
        sender: { ...sender, phone2: sender.phone2 || null },
        receiver: { ...receiver, phone2: receiver.phone2 || null },
      }).unwrap();
      toast.success('Customer details updated');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to update customer details');
    }
  };
  return { sender, receiver, onChange, onSave, isSaving };
}
