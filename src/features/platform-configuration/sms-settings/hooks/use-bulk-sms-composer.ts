import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useMemo, useReducer } from 'react';
import { toast } from 'sonner';
import { useCreateBulkSmsCampaignMutation } from '../services';
import type { BulkSmsAudience, CompanySmsTemplate } from '../types';
import { appendSmsVariable, getUnsupportedBulkSmsVariables } from '../utils';

type BulkSmsDraft = {
  name: string;
  audienceType: BulkSmsAudience;
  source: 'template' | 'new';
  templateId: string;
  body: string;
};

const INITIAL_DRAFT: BulkSmsDraft = {
  name: '',
  audienceType: 'customers_all',
  source: 'template',
  templateId: '',
  body: '',
};

export function useBulkSmsComposer(templates: CompanySmsTemplate[], onCreated: () => void) {
  const [draft, updateDraft] = useReducer(
    (current: BulkSmsDraft, patch: Partial<BulkSmsDraft>) => ({ ...current, ...patch }),
    INITIAL_DRAFT,
  );
  const [createCampaign, { isLoading }] = useCreateBulkSmsCampaignMutation();
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === draft.templateId),
    [draft.templateId, templates],
  );

  const create = useCallback(
    async (submitForApproval: boolean) => {
      if (!draft.name.trim()) {
        toast.error('Bulk SMS name is required');
        return;
      }
      if (draft.source === 'template' && !draft.templateId) {
        toast.error('Select an SMS template');
        return;
      }
      if (draft.source === 'new' && !draft.body.trim()) {
        toast.error('Enter the SMS message');
        return;
      }
      const messageBody = draft.source === 'template' ? selectedTemplate?.body : draft.body;
      const unsupportedVariables = getUnsupportedBulkSmsVariables(messageBody ?? '');
      if (unsupportedVariables.length) {
        toast.error(`Unsupported bulk SMS variables: ${unsupportedVariables.join(', ')}`);
        return;
      }
      try {
        await createCampaign({
          name: draft.name.trim(),
          audienceType: draft.audienceType,
          templateId: draft.source === 'template' ? draft.templateId : null,
          body: draft.source === 'new' ? draft.body.trim() : null,
          submitForApproval,
        }).unwrap();
        toast.success(
          submitForApproval ? 'Bulk SMS submitted for approval' : 'Bulk SMS draft saved',
        );
        onCreated();
      } catch (error) {
        toast.error(getApplicationErrorMessage(error, '') || 'Failed to create bulk SMS');
      }
    },
    [createCampaign, draft, onCreated, selectedTemplate?.body],
  );

  return {
    create,
    draft,
    isLoading,
    selectedTemplate,
    insertVariable: (variable: string) =>
      updateDraft({ body: appendSmsVariable(draft.body, variable) }),
    updateDraft,
  };
}
