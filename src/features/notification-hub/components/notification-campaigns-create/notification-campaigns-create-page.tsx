import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateNotificationCampaignMutation,
  useListNotificationTemplateOptionsQuery,
} from '../../api/notification-hub.api';

export function NotificationCampaignsCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [channel, setChannel] = useState('sms');
  const [templateId, setTemplateId] = useState('__none__');
  const [subjectOverride, setSubjectOverride] = useState('');
  const [bodyOverride, setBodyOverride] = useState('');
  const [audienceType, setAudienceType] = useState('customers_all');
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [createCampaign, { isLoading }] = useCreateNotificationCampaignMutation();
  const { data: templateOptions = [] } = useListNotificationTemplateOptionsQuery({ channel });

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (templateId === '__none__' && !bodyOverride.trim()) {
      toast.error('Provide a template or body override');
      return;
    }

    try {
      await createCampaign({
        name: name.trim(),
        eventCode: eventCode.trim() || null,
        channel,
        templateId: templateId === '__none__' ? null : templateId,
        subjectOverride: subjectOverride.trim() || null,
        bodyOverride: bodyOverride.trim() || null,
        audienceType,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      }).unwrap();
      toast.success('Campaign created');
      navigate('/notification-hub/campaigns');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Notification Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Campaign Name</FieldLabel>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Event Code (optional)</FieldLabel>
                <Input
                  value={eventCode}
                  onChange={(event) => setEventCode(event.target.value)}
                  placeholder="holiday, birthday, celebration"
                />
              </Field>

              <Field>
                <FieldLabel>Channel</FieldLabel>
                <Select
                  value={channel}
                  onValueChange={(value) => {
                    setChannel(value);
                    setTemplateId('__none__');
                  }}
                >
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
                <FieldLabel>Audience</FieldLabel>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers_all">All Customers</SelectItem>
                    <SelectItem value="users_all">All Users</SelectItem>
                    <SelectItem value="employees_all">All Employees</SelectItem>
                    <SelectItem value="employees_birthday_today">
                      Employees Birthday (Today)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Template (optional)</FieldLabel>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No template</SelectItem>
                    {templateOptions.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Subject Override (email)</FieldLabel>
                <Input
                  value={subjectOverride}
                  onChange={(event) => setSubjectOverride(event.target.value)}
                  placeholder="Leave blank to use template subject"
                />
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Body Override</FieldLabel>
                <Textarea
                  rows={7}
                  value={bodyOverride}
                  onChange={(event) => setBodyOverride(event.target.value)}
                  placeholder="Leave blank to use template body"
                />
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Schedule At (optional)</FieldLabel>
                <DateTimePicker
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  placeholder="Select schedule date and time"
                />
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save campaign
              </Button>
              <Button variant="outline" onClick={() => navigate('/notification-hub/campaigns')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
