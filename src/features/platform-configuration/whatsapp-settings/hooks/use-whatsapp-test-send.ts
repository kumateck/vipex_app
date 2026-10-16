import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useSendWhatsAppTestMutation } from '../services';
import { getWhatsAppSettingsErrorMessage } from '../utils';

export function useWhatsAppTestSend() {
  const [phone, setPhone] = useState('');
  const [send, { isLoading: isSending }] = useSendWhatsAppTestMutation();

  const submit = useCallback(async () => {
    try {
      await send({ phone }).unwrap();
      toast.success('Test message accepted by WhatsApp');
    } catch (error) {
      toast.error(getWhatsAppSettingsErrorMessage(error, 'WhatsApp test failed'));
    }
  }, [phone, send]);

  return { phone, setPhone, submit, isSending };
}
