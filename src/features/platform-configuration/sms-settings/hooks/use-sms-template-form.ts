import { useCallback, useReducer } from 'react';
import { toast } from 'sonner';
import {
  useCreateCompanySmsTemplateMutation,
  useUpdateCompanySmsTemplateMutation,
} from '../services';
import type { CompanySmsTemplate, SmsTemplateFormValues } from '../types';
import {
  appendSmsVariable,
  extractSmsTemplateVariables,
  getUnsupportedBulkSmsVariables,
} from '../utils';

type TemplateDraft = Omit<SmsTemplateFormValues, 'variables'>;

function getInitialDraft(template?: CompanySmsTemplate | null): TemplateDraft {
  return {
    code: template?.code ?? '',
    name: template?.name ?? '',
    body: template?.body ?? '',
    isActive: template?.isActive ?? true,
  };
}

export function useSmsTemplateForm(
  template: CompanySmsTemplate | null | undefined,
  onSaved: () => void,
) {
  const [draft, updateDraft] = useReducer(
    (current: TemplateDraft, patch: Partial<TemplateDraft>) => ({ ...current, ...patch }),
    template,
    getInitialDraft,
  );
  const [createTemplate, createState] = useCreateCompanySmsTemplateMutation();
  const [updateTemplate, updateState] = useUpdateCompanySmsTemplateMutation();
  const isEditing = Boolean(template);

  const save = useCallback(async () => {
    if (!draft.name.trim() || !draft.code.trim() || !draft.body.trim()) {
      toast.error('Template name, code, and message are required');
      return;
    }
    const unsupportedVariables = getUnsupportedBulkSmsVariables(draft.body);
    if (unsupportedVariables.length) {
      toast.error(`Unsupported bulk SMS variables: ${unsupportedVariables.join(', ')}`);
      return;
    }
    const values: SmsTemplateFormValues = {
      code: draft.code.trim().toLowerCase(),
      name: draft.name.trim(),
      body: draft.body.trim(),
      variables: extractSmsTemplateVariables(draft.body),
      isActive: draft.isActive,
    };
    try {
      if (template) {
        const { code: _code, ...body } = values;
        await updateTemplate({ id: template.id, body }).unwrap();
        toast.success('SMS template updated');
      } else {
        await createTemplate(values).unwrap();
        toast.success('SMS template created');
      }
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save SMS template');
    }
  }, [createTemplate, draft, onSaved, template, updateTemplate]);

  return {
    draft,
    isEditing,
    isSaving: createState.isLoading || updateState.isLoading,
    insertVariable: (variable: string) =>
      updateDraft({ body: appendSmsVariable(draft.body, variable) }),
    save,
    updateDraft,
  };
}
