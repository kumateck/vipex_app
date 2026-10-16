import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useSaveWhatsAppProviderMutation } from '../services';
import type { WhatsAppProviderFormValues, WhatsAppProviderSettings } from '../types';
import { getWhatsAppSettingsErrorMessage } from '../utils';

function toFormValues(provider?: WhatsAppProviderSettings): WhatsAppProviderFormValues {
  return {
    phoneNumberId: provider?.phoneNumberId ?? '',
    wabaId: provider?.wabaId ?? '',
    apiVersion: provider?.apiVersion ?? '',
    // Secrets are write-only: blank means "keep the stored value".
    accessToken: '',
    appSecret: '',
    webhookVerifyToken: '',
    isActive: provider?.exists ? provider.isActive : true,
  };
}

export function useWhatsAppProviderForm(provider?: WhatsAppProviderSettings) {
  const [values, setValues] = useState(() => toFormValues(provider));
  const [save, { isLoading: isSaving }] = useSaveWhatsAppProviderMutation();

  const setField = useCallback(
    <K extends keyof WhatsAppProviderFormValues>(key: K, value: WhatsAppProviderFormValues[K]) =>
      setValues((current) => ({ ...current, [key]: value })),
    [],
  );

  const submit = useCallback(async () => {
    if (!values.phoneNumberId.trim()) {
      toast.error('Phone number ID is required');
      return;
    }
    try {
      await save(values).unwrap();
      setValues((current) => ({
        ...current,
        accessToken: '',
        appSecret: '',
        webhookVerifyToken: '',
      }));
      toast.success('WhatsApp provider saved');
    } catch (error) {
      toast.error(getWhatsAppSettingsErrorMessage(error, 'Failed to save WhatsApp provider'));
    }
  }, [save, values]);

  return { values, setField, submit, isSaving };
}
