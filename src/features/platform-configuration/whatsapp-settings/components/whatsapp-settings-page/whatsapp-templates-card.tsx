import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WhatsAppEventTemplate } from '../../types';

const TemplateRow = memo(function TemplateRow({
  event,
  canManage,
  onEdit,
}: {
  event: WhatsAppEventTemplate;
  canManage: boolean;
  onEdit: (event: WhatsAppEventTemplate) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{event.name}</p>
          <Badge variant="outline">{event.category}</Badge>
          {event.isCustomized ? <Badge variant="secondary">Customized</Badge> : null}
        </div>
        {canManage ? (
          <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
            Edit
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{event.description}</p>
      <p className="text-sm">
        Template <code className="rounded bg-muted px-1">{event.templateName}</code> · language{' '}
        <code className="rounded bg-muted px-1">{event.language}</code>
      </p>
    </div>
  );
});

export function WhatsAppTemplatesCard({
  events,
  canManage,
  onEdit,
}: {
  events: WhatsAppEventTemplate[];
  canManage: boolean;
  onEdit: (event: WhatsAppEventTemplate) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message templates</CardTitle>
        <CardDescription>
          WhatsApp only delivers business-initiated messages that use a template approved in Meta
          WhatsApp Manager. Create each template there, then enter its exact name here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <TemplateRow key={event.code} event={event} canManage={canManage} onEdit={onEdit} />
        ))}
      </CardContent>
    </Card>
  );
}
