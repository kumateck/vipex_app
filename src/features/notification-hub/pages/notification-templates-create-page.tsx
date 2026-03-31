import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useCreateNotificationTemplateMutation } from '../api/notification-hub.api';

export function NotificationTemplatesCreatePage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState('sms');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [variablesJson, setVariablesJson] = useState('[]');
  const [isActive, setIsActive] = useState(true);
  const [createTemplate, { isLoading }] = useCreateNotificationTemplateMutation();

  const onSubmit = async () => {
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
    if (variablesJson.trim()) {
      try {
        parsedVariables = JSON.parse(variablesJson);
      } catch {
        toast.error('Variables JSON must be valid JSON');
        return;
      }
    }

    try {
      await createTemplate({
        channel,
        code: code.trim(),
        name: name.trim(),
        subject: subject.trim() || null,
        body,
        variablesJson: parsedVariables,
        isActive,
      }).unwrap();
      toast.success('Notification template created');
      navigate('/notification-hub/templates');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create template');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Notification Template</CardTitle>
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
              <FieldLabel>Template Code</FieldLabel>
              <Input value={code} onChange={(event) => setCode(event.target.value)} />
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
                value={variablesJson}
                onChange={(event) => setVariablesJson(event.target.value)}
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
            <Button onClick={onSubmit} disabled={isLoading}>
              Save template
            </Button>
            <Button variant="outline" onClick={() => navigate('/notification-hub/templates')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
