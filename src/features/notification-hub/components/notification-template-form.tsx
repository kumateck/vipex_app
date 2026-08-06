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

export type NotificationTemplateFormValues = {
  channel: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  variablesJson: unknown;
  isActive: boolean;
};

type NotificationTemplateFormProps = {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  initialValues?: Partial<NotificationTemplateFormValues>;
  onSubmit: (values: NotificationTemplateFormValues) => Promise<void> | void;
  onCancel: () => void;
};

const DEFAULT_VALUES: NotificationTemplateFormValues = {
  channel: 'sms',
  code: '',
  name: '',
  subject: '',
  body: '',
  variablesJson: [],
  isActive: true,
};

function toPrettyJson(value: unknown) {
  if (value === null || value === undefined) return '[]';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '[]';
  }
}

export function NotificationTemplateForm({
  mode,
  isSubmitting,
  initialValues,
  onSubmit,
  onCancel,
}: NotificationTemplateFormProps) {
  const [channel, setChannel] = useState(DEFAULT_VALUES.channel);
  const [code, setCode] = useState(DEFAULT_VALUES.code);
  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [subject, setSubject] = useState(DEFAULT_VALUES.subject);
  const [body, setBody] = useState(DEFAULT_VALUES.body);
  const [variablesText, setVariablesText] = useState(toPrettyJson(DEFAULT_VALUES.variablesJson));
  const [isActive, setIsActive] = useState(DEFAULT_VALUES.isActive);

  useEffect(() => {
    const next = {
      ...DEFAULT_VALUES,
      ...initialValues,
    };

    setChannel(next.channel);
    setCode(next.code);
    setName(next.name);
    setSubject(next.subject);
    setBody(next.body);
    setVariablesText(toPrettyJson(next.variablesJson));
    setIsActive(next.isActive);
  }, [initialValues]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!code.trim()) {
      toast.error('Template code is required');
      return;
    }

    if (!body.trim()) {
      toast.error('Template body is required');
      return;
    }

    let parsedVariables: unknown = null;
    if (variablesText.trim()) {
      try {
        parsedVariables = JSON.parse(variablesText);
      } catch {
        toast.error('Variables JSON must be valid JSON');
        return;
      }
    }

    await onSubmit({
      channel,
      code: code.trim(),
      name: name.trim(),
      subject,
      body,
      variablesJson: parsedVariables,
      isActive,
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
          <FieldLabel>Template Code</FieldLabel>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={mode === 'edit'}
          />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Template Name</FieldLabel>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Subject (email only)</FieldLabel>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Body</FieldLabel>
          <Textarea
            rows={7}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Use variables like {{recipientName}} and {{date}}"
          />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Variables JSON</FieldLabel>
          <Textarea
            rows={4}
            value={variablesText}
            onChange={(event) => setVariablesText(event.target.value)}
            placeholder='["recipientName","date"]'
          />
        </Field>

        <Field className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
          <FieldLabel className="mb-0">Template Active</FieldLabel>
          <Checkbox
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
          />
        </Field>
      </FieldGroup>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {mode === 'create' ? 'Create template' : 'Save changes'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
