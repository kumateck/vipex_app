import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useSendWhatsAppTestMutation } from '../services';
import { DEFAULT_TEST_TEMPLATE, getWhatsAppSettingsErrorMessage } from '../utils';

export function useWhatsAppTestSend() {
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState(DEFAULT_TEST_TEMPLATE);
  const [send, { isLoading: isSending }] = useSendWhatsAppTestMutation();

  const submit = useCallback(async () => {
    try {
      const result = await send({ phone, template }).unwrap();
      toast.success(`Test message (${result.templateName}) accepted by WhatsApp`);
    } catch (error) {
      toast.error(getWhatsAppSettingsErrorMessage(error, 'WhatsApp test failed'));
    }
  }, [phone, template, send]);

  return { phone, setPhone, template, setTemplate, submit, isSending };
}
