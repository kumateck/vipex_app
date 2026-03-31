import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateNotificationProviderMutation } from '../api/notification-hub.api';

export function NotificationProvidersCreatePage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState('sms');
  const [providerKey, setProviderKey] = useState('log_only');
  const [name, setName] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [createProvider, { isLoading }] = useCreateNotificationProviderMutation();

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error('Provider name is required');
      return;
    }
    if (!providerKey.trim()) {
      toast.error('Provider key is required');
      return;
    }

    let parsedConfig: unknown = null;
    if (configJson.trim()) {
      try {
        parsedConfig = JSON.parse(configJson);
      } catch {
        toast.error('Provider config must be valid JSON');
        return;
      }
    }

    try {
      await createProvider({
        channel,
        providerKey,
        name: name.trim(),
        configJson: parsedConfig,
        isActive,
        isDefault,
      }).unwrap();
      toast.success('Notification provider created');
      navigate('/notification-hub/providers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create provider');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Notification Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Channel</FieldLabel>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Provider Key</FieldLabel>
              <Input
                value={providerKey}
                onChange={(event) => setProviderKey(event.target.value)}
                placeholder="log_only, custom_webhook, smtp"
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Provider Name</FieldLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Friendly provider name"
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Provider Config (JSON)</FieldLabel>
              <Textarea
                rows={8}
                value={configJson}
                onChange={(event) => setConfigJson(event.target.value)}
                placeholder='{"url":"https://api.example.com/send","headers":{"x-api-key":"..."} }'
              />
            </Field>

            <Field className="flex items-center justify-between rounded-md border p-3">
              <FieldLabel className="mb-0">Active</FieldLabel>
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
            </Field>
            <Field className="flex items-center justify-between rounded-md border p-3">
              <FieldLabel className="mb-0">Set as default</FieldLabel>
              <Checkbox
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={isLoading}>
              Save provider
            </Button>
            <Button variant="outline" onClick={() => navigate('/notification-hub/providers')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
