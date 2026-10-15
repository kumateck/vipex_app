import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  type SelfServiceDraft,
  useUpdateSelfServiceDraftMutation,
} from '../api/self-service-agent.api';
import { getSelfServiceParcelError } from '../utils';

type Contact = { fullname: string; phone: string; phone2: string };
type Parcel = { content: string; value: string };
export function useSelfServiceDraftEditor(draft: SelfServiceDraft, onClose: () => void) {
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
  const [parcel, setParcel] = useState<Parcel>(() => ({
    content: draft.parcelContent,
    value: String(draft.parcelValuePsw / 100),
  }));
  const [save, { isLoading: isSaving }] = useUpdateSelfServiceDraftMutation();
  const parcelError = getSelfServiceParcelError(parcel);
  const onChange = (role: 'sender' | 'receiver', field: keyof Contact, value: string) =>
    (role === 'sender' ? setSender : setReceiver)((current) => ({ ...current, [field]: value }));
  const onParcelChange = (field: keyof Parcel, value: string) =>
    setParcel((current) => ({ ...current, [field]: value }));
  const onSave = async () => {
    if (isSaving || parcelError) return;
    try {
      await save({
        id: draft.id,
        expectedUpdatedAt: draft.updatedAt,
        sender: { ...sender, phone2: sender.phone2 || null },
        receiver: { ...receiver, phone2: receiver.phone2 || null },
        parcelContent: parcel.content.trim(),
        parcelValueCedis: parcel.value.replace(/,/g, '').trim(),
      }).unwrap();
      toast.success('Booking details updated');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to update booking details');
    }
  };
  return { sender, receiver, parcel, parcelError, onChange, onParcelChange, onSave, isSaving };
}
