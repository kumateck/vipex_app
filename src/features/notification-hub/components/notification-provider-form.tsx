import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type NotificationProviderFormValues = {
  channel: string;
  providerKey: string;
  name: string;
  configJson: unknown;
  isActive: boolean;
  isDefault: boolean;
};

type NotificationProviderFormProps = {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  initialValues?: Partial<NotificationProviderFormValues>;
  onSubmit: (values: NotificationProviderFormValues) => Promise<void> | void;
  onCancel: () => void;
};

const DEFAULT_VALUES: NotificationProviderFormValues = {
  channel: 'sms',
  providerKey: 'log_only',
  name: '',
  configJson: null,
  isActive: true,
  isDefault: false,
};

function toPrettyJson(value: unknown) {
  if (value === null || value === undefined) return '{}';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

export function NotificationProviderForm({
  mode,
  isSubmitting,
  initialValues,
  onSubmit,
  onCancel,
}: NotificationProviderFormProps) {
  const [channel, setChannel] = useState(DEFAULT_VALUES.channel);
  const [providerKey, setProviderKey] = useState(DEFAULT_VALUES.providerKey);
  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [configText, setConfigText] = useState(toPrettyJson(DEFAULT_VALUES.configJson));
  const [isActive, setIsActive] = useState(DEFAULT_VALUES.isActive);
  const [isDefault, setIsDefault] = useState(DEFAULT_VALUES.isDefault);

  useEffect(() => {
    const next = {
      ...DEFAULT_VALUES,
      ...initialValues,
    };

    setChannel(next.channel);
    setProviderKey(next.providerKey);
    setName(next.name);
    setConfigText(toPrettyJson(next.configJson));
    setIsActive(next.isActive);
    setIsDefault(next.isDefault);
  }, [initialValues]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Provider name is required');
      return;
    }

    if (!providerKey.trim()) {
      toast.error('Provider key is required');
      return;
    }

    let parsedConfig: unknown = null;
    if (configText.trim()) {
      try {
        parsedConfig = JSON.parse(configText);
      } catch {
        toast.error('Provider config must be valid JSON');
        return;
      }
    }

    await onSubmit({
      channel,
      providerKey: providerKey.trim(),
      name: name.trim(),
      configJson: parsedConfig,
      isActive,
      isDefault,
    });
  };

  return (
    <div className="space-y-4">
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>Channel</FieldLabel>
          <Select value={channel} onValueChange={setChannel} disabled={mode === 'edit'}>
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
            disabled={mode === 'edit'}
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
            value={configText}
            onChange={(event) => setConfigText(event.target.value)}
            placeholder='{"url":"https://api.example.com/send","headers":{"x-api-key":"..."}}'
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
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {mode === 'create' ? 'Create provider' : 'Save changes'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
