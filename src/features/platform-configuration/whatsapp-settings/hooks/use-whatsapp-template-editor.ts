import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateWhatsAppEventTemplateMutation } from '../services';
import type { WhatsAppEventTemplate } from '../types';
import { getWhatsAppSettingsErrorMessage } from '../utils';

export function useWhatsAppTemplateEditor(event: WhatsAppEventTemplate, onSaved: () => void) {
  const [templateName, setTemplateName] = useState(event.templateName);
  const [language, setLanguage] = useState(event.language);
  const [update, { isLoading: isSaving }] = useUpdateWhatsAppEventTemplateMutation();

  const submit = useCallback(async () => {
    try {
      await update({ eventCode: event.code, templateName, language }).unwrap();
      toast.success(`${event.name} template saved`);
      onSaved();
    } catch (error) {
      toast.error(getWhatsAppSettingsErrorMessage(error, 'Failed to save template'));
    }
  }, [event.code, event.name, language, onSaved, templateName, update]);

  return { templateName, setTemplateName, language, setLanguage, submit, isSaving };
}
