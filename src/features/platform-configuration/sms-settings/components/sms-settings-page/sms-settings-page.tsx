import { MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanySmsSettings } from '../../hooks';
import { useSmsDefinitionsManager } from '../../hooks';
import { BulkSmsDialog, SmsEventDefinitionDialog, SmsTemplateDialog } from '../../dialogs';
import type { CompanySmsEventDefinition } from '../../types';
import { DefaultSmsProviderCard } from './default-sms-provider-card';
import { BulkSmsCard } from './bulk-sms-card';
import { SmsDefinitionsListCard } from './sms-definitions-list-card';

const EMPTY_EVENTS: CompanySmsEventDefinition[] = [];

export function SmsSettingsPage() {
  const settings = useCompanySmsSettings();
  const events = settings.data?.events ?? EMPTY_EVENTS;
  const manager = useSmsDefinitionsManager(events);

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SMS Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Configure the company-wide provider and every transactional SMS dispatched by the
            platform.
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <MessageSquareText className="h-3.5 w-3.5" />
          Platform Configuration
        </Badge>
      </div>

      <ScrollableWrapper>
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 md:w-fit md:min-w-[30rem]">
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="definitions">SMS Definitions</TabsTrigger>
            <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="mt-4">
            <DefaultSmsProviderCard
              settings={settings.data}
              isLoading={settings.isLoading}
              canManage={settings.canManageProviders}
              selectedProviderKey={settings.selectedProviderKey}
              isDirty={settings.isProviderDirty}
              isSaving={settings.isSavingProvider}
              onProviderChange={settings.setSelectedProviderKey}
              onSave={settings.saveDefaultProvider}
            />
          </TabsContent>

          <TabsContent value="definitions" className="mt-4">
            <SmsDefinitionsListCard
              events={events}
              templates={manager.reusableTemplates}
              isLoading={settings.isLoading || manager.isLoadingTemplates}
              canManage={settings.canManageTemplates}
              onAdd={manager.openNewTemplate}
              onEditEvent={manager.openEventEditor}
              onEditTemplate={manager.openTemplateEditor}
            />
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <BulkSmsCard canCreate={settings.canCreateBulkSms} onCreate={manager.openBulkSms} />
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>

      {manager.eventToEdit ? (
        <SmsEventDefinitionDialog event={manager.eventToEdit} onClose={manager.closeEventEditor} />
      ) : null}
      {manager.isAddingTemplate || manager.templateToEdit ? (
        <SmsTemplateDialog
          key={manager.templateToEdit?.id ?? 'new'}
          template={manager.templateToEdit}
          onClose={manager.closeTemplateEditor}
        />
      ) : null}
      <BulkSmsDialog
        key={String(manager.isBulkSmsOpen)}
        open={manager.isBulkSmsOpen}
        templates={manager.reusableTemplates}
        onOpenChange={manager.setIsBulkSmsOpen}
      />
    </div>
  );
}
