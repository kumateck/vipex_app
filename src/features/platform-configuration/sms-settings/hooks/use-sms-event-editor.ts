import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateCompanySmsEventMutation } from '../services';
import type { CompanySmsEventDefinition } from '../types';

export function useSmsEventEditor(event: CompanySmsEventDefinition) {
  const [body, setBody] = useState(event.body);
  const [updateEvent, { isLoading }] = useUpdateCompanySmsEventMutation();
  const isDirty = body.trim() !== event.body;

  const insertVariable = useCallback((variable: string) => {
    setBody((current) => `${current}${current.endsWith(' ') ? '' : ' '}{{${variable}}}`);
  }, []);

  const reset = useCallback(() => setBody(event.body), [event.body]);

  const save = useCallback(async () => {
    if (!body.trim()) {
      toast.error('SMS message body is required');
      return false;
    }
    try {
      await updateEvent({ eventCode: event.code, body }).unwrap();
      toast.success(`${event.name} SMS definition saved`);
      return true;
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save SMS definition');
      return false;
    }
  }, [body, event.code, event.name, updateEvent]);

  return { body, setBody, insertVariable, reset, save, isDirty, isLoading };
}
