import { useCallback, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppTemplateDialog } from '../../dialogs';
import { useWhatsAppSettings } from '../../hooks';
import type { WhatsAppEventTemplate } from '../../types';
import { WhatsAppProviderCard } from './whatsapp-provider-card';
import { WhatsAppTemplatesCard } from './whatsapp-templates-card';
import { WhatsAppTestCard } from './whatsapp-test-card';

export function WhatsAppSettingsPage() {
  const settings = useWhatsAppSettings();
  const [eventToEdit, setEventToEdit] = useState<WhatsAppEventTemplate | null>(null);
  const closeEditor = useCallback(() => setEventToEdit(null), []);

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Settings</h1>
          <p className="text-sm text-muted-foreground">
            Connect the company WhatsApp Business number used for pickup OTPs and digital receipts.
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <MessageCircle className="h-3.5 w-3.5" />
          Platform Configuration
        </Badge>
      </div>

      {settings.isLoading || !settings.data ? (
        <p className="text-sm text-muted-foreground">Loading WhatsApp settings...</p>
      ) : (
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 md:w-fit md:min-w-[20rem]">
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="provider" className="mt-4 space-y-4">
            <WhatsAppProviderCard
              key={settings.data.provider.updatedAt ?? 'new'}
              settings={settings.data}
              canManage={settings.canManageProvider}
            />
            {settings.canManageProvider && settings.data.provider.exists ? (
              <WhatsAppTestCard />
            ) : null}
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <WhatsAppTemplatesCard
              events={settings.data.events}
              canManage={settings.canManageTemplates}
              onEdit={setEventToEdit}
            />
          </TabsContent>
        </Tabs>
      )}

      {eventToEdit ? <WhatsAppTemplateDialog event={eventToEdit} onClose={closeEditor} /> : null}
    </div>
  );
}
