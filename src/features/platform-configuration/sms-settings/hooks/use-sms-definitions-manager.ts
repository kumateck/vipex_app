import { useMemo, useState } from 'react';
import { useListCompanySmsTemplatesQuery } from '../services';
import type { CompanySmsEventDefinition, CompanySmsTemplate } from '../types';

export function useSmsDefinitionsManager(events: CompanySmsEventDefinition[]) {
  const templatesQuery = useListCompanySmsTemplatesQuery();
  const [eventToEdit, setEventToEdit] = useState<CompanySmsEventDefinition | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<CompanySmsTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isBulkSmsOpen, setIsBulkSmsOpen] = useState(false);
  const eventCodes = useMemo(() => new Set(events.map((event) => event.code)), [events]);
  const reusableTemplates = useMemo(
    () => (templatesQuery.data?.data ?? []).filter((template) => !eventCodes.has(template.code)),
    [eventCodes, templatesQuery.data?.data],
  );

  return {
    eventToEdit,
    isAddingTemplate,
    isBulkSmsOpen,
    isLoadingTemplates: templatesQuery.isLoading,
    reusableTemplates,
    templateToEdit,
    closeEventEditor: () => setEventToEdit(null),
    closeTemplateEditor: () => {
      setIsAddingTemplate(false);
      setTemplateToEdit(null);
    },
    openBulkSms: () => setIsBulkSmsOpen(true),
    openEventEditor: setEventToEdit,
    openNewTemplate: () => setIsAddingTemplate(true),
    openTemplateEditor: setTemplateToEdit,
    setIsBulkSmsOpen,
  };
}
