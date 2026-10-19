import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWhatsAppProviderForm } from '../../hooks';
import type { WhatsAppSettings } from '../../types';
import { WhatsAppProviderField, secretPlaceholder } from './whatsapp-provider-fields';

export function WhatsAppProviderCard({
  settings,
  canManage,
}: {
  settings: WhatsAppSettings;
  canManage: boolean;
}) {
  const { provider, availability, webhookUrl } = settings;
  const form = useWhatsAppProviderForm(provider);
  const disabled = !canManage || form.isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Cloud API
          <Badge variant={availability.configured ? 'default' : 'outline'}>
            {availability.configured ? 'Ready' : 'Not configured'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Credentials from Meta WhatsApp Manager. Secrets are write-only: they are never shown again
          after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <WhatsAppProviderField
            id="wa-phone-number-id"
            label="Phone number ID"
            value={form.values.phoneNumberId}
            onChange={(value) => form.setField('phoneNumberId', value)}
            disabled={disabled}
          />
          <WhatsAppProviderField
            id="wa-waba-id"
            label="WhatsApp Business Account ID"
            value={form.values.wabaId}
            onChange={(value) => form.setField('wabaId', value)}
            disabled={disabled}
          />
          <WhatsAppProviderField
            id="wa-access-token"
            label="Permanent access token"
            secret
            value={form.values.accessToken}
            placeholder={secretPlaceholder(provider.hasAccessToken, provider.accessTokenSource)}
            onChange={(value) => form.setField('accessToken', value)}
            disabled={disabled}
          />
          <WhatsAppProviderField
            id="wa-api-version"
            label="Graph API version"
            value={form.values.apiVersion}
            placeholder="v21.0"
            onChange={(value) => form.setField('apiVersion', value)}
            disabled={disabled}
          />
          <WhatsAppProviderField
            id="wa-app-secret"
            label="App secret"
            secret
            value={form.values.appSecret}
            placeholder={secretPlaceholder(provider.hasAppSecret)}
            hint="Used to verify delivery-status webhooks."
            onChange={(value) => form.setField('appSecret', value)}
            disabled={disabled}
          />
          <WhatsAppProviderField
            id="wa-verify-token"
            label="Webhook verify token"
            secret
            value={form.values.webhookVerifyToken}
            placeholder={secretPlaceholder(provider.hasWebhookVerifyToken)}
            hint={`Webhook URL: ${webhookUrl}`}
            onChange={(value) => form.setField('webhookVerifyToken', value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="wa-active"
              checked={form.values.isActive}
              disabled={disabled}
              onCheckedChange={(checked) => form.setField('isActive', checked === true)}
            />
            <Label htmlFor="wa-active">Use WhatsApp for this company</Label>
          </div>
          {canManage ? (
            <Button onClick={form.submit} disabled={form.isSaving}>
              {form.isSaving ? 'Saving...' : 'Save provider'}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
