import { MessagesSquare, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CompanySmsEventDefinition, CompanySmsTemplate } from '../../types';
import { normalizeSmsTemplateVariables } from '../../utils';
import {
  SmsDefinitionActionCell,
  SmsDefinitionCell,
  SmsVariablesCell,
} from './sms-definition-table-cells';

type SmsDefinitionsListCardProps = {
  events: CompanySmsEventDefinition[];
  templates: CompanySmsTemplate[];
  isLoading: boolean;
  canManage: boolean;
  onAdd: () => void;
  onEditEvent: (event: CompanySmsEventDefinition) => void;
  onEditTemplate: (template: CompanySmsTemplate) => void;
};

export function SmsDefinitionsListCard({
  events,
  templates,
  isLoading,
  canManage,
  onAdd,
  onEditEvent,
  onEditTemplate,
}: SmsDefinitionsListCardProps) {
  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5" />
            SMS Definitions
          </CardTitle>
          <CardDescription>
            Review application-triggered messages and reusable templates in one list.
          </CardDescription>
        </div>
        <Button type="button" onClick={onAdd} disabled={!canManage}>
          <Plus className="h-4 w-4" />
          Add new
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table className="table-fixed min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Definition</TableHead>
                <TableHead className="w-[9%]">Type</TableHead>
                <TableHead className="w-[28%]">Dispatch / usage</TableHead>
                <TableHead className="w-[18%]">Variables</TableHead>
                <TableHead className="w-[8%]">Status</TableHead>
                <TableHead className="w-[7%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.code}>
                  <SmsDefinitionCell
                    name={event.name}
                    code={event.code}
                    detail={event.description}
                  />
                  <TableCell className="align-top whitespace-normal">
                    <Badge variant="secondary">Application</Badge>
                  </TableCell>
                  <TableCell className="align-top text-sm whitespace-normal">
                    <p className="line-clamp-2 break-words">{event.dispatchAction}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      To: {event.recipient}
                    </p>
                  </TableCell>
                  <SmsVariablesCell variables={event.variables} />
                  <TableCell className="align-top whitespace-normal">
                    <Badge variant={event.isCustomized ? 'default' : 'outline'}>
                      {event.isCustomized ? 'Customized' : 'Default'}
                    </Badge>
                  </TableCell>
                  <SmsDefinitionActionCell
                    disabled={!canManage}
                    onEdit={() => onEditEvent(event)}
                  />
                </TableRow>
              ))}
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <SmsDefinitionCell
                    name={template.name}
                    code={template.code}
                    detail={template.body}
                  />
                  <TableCell className="align-top whitespace-normal">
                    <Badge variant="outline">Reusable</Badge>
                  </TableCell>
                  <TableCell className="align-top text-sm whitespace-normal">
                    Bulk SMS campaigns
                  </TableCell>
                  <SmsVariablesCell
                    variables={normalizeSmsTemplateVariables(template.variablesJson)}
                  />
                  <TableCell className="align-top whitespace-normal">
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <SmsDefinitionActionCell
                    disabled={!canManage}
                    onEdit={() => onEditTemplate(template)}
                  />
                </TableRow>
              ))}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>Loading SMS definitions...</TableCell>
                </TableRow>
              ) : null}
              {!isLoading && !events.length && !templates.length ? (
                <TableRow>
                  <TableCell colSpan={6}>No SMS definitions found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        {!canManage ? (
          <p className="mt-3 text-xs text-muted-foreground">
            You can view definitions but need template-management permission to change them.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
