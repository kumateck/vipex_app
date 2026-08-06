import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { useBulkSmsComposer } from '../hooks';
import type { BulkSmsAudience, CompanySmsTemplate } from '../types';
import { BULK_SMS_AUDIENCES, BULK_SMS_VARIABLES } from '../utils';

type Composer = ReturnType<typeof useBulkSmsComposer>;

export function BulkSmsDialogFields({
  composer,
  templates,
}: {
  composer: Composer;
  templates: CompanySmsTemplate[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel>Campaign name</FieldLabel>
        <Input
          value={composer.draft.name}
          onChange={(event) => composer.updateDraft({ name: event.target.value })}
          placeholder="August customer update"
        />
      </Field>
      <Field>
        <FieldLabel>Audience</FieldLabel>
        <Select
          value={composer.draft.audienceType}
          onValueChange={(value) =>
            composer.updateDraft({ audienceType: value as BulkSmsAudience })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select audience" />
          </SelectTrigger>
          <SelectContent>
            {BULK_SMS_AUDIENCES.map((audience) => (
              <SelectItem key={audience.value} value={audience.value}>
                {audience.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel>Message source</FieldLabel>
        <Select
          value={composer.draft.source}
          onValueChange={(value) => composer.updateDraft({ source: value as 'template' | 'new' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="template">Use a saved SMS template</SelectItem>
            <SelectItem value="new">Write a new one-off message</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {composer.draft.source === 'template' ? (
        <SavedTemplateFields templates={templates} composer={composer} />
      ) : (
        <NewMessageFields composer={composer} />
      )}
    </div>
  );
}

function SavedTemplateFields({
  templates,
  composer,
}: {
  templates: CompanySmsTemplate[];
  composer: Composer;
}) {
  return (
    <>
      <Field className="md:col-span-2">
        <FieldLabel>SMS template</FieldLabel>
        <Select
          value={composer.draft.templateId}
          onValueChange={(templateId) => composer.updateDraft({ templateId })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an active template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id} disabled={!template.isActive}>
                {template.name} ({template.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {composer.selectedTemplate ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm md:col-span-2">
          {composer.selectedTemplate.body}
        </div>
      ) : null}
    </>
  );
}

function NewMessageFields({ composer }: { composer: Composer }) {
  return (
    <>
      <Field className="md:col-span-2">
        <FieldLabel>Message</FieldLabel>
        <Textarea
          rows={7}
          maxLength={2000}
          value={composer.draft.body}
          onChange={(event) => composer.updateDraft({ body: event.target.value })}
        />
      </Field>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        {BULK_SMS_VARIABLES.map((variable) => (
          <Button
            key={variable}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 font-mono text-xs"
            onClick={() => composer.insertVariable(variable)}
          >
            {`{{${variable}}}`}
          </Button>
        ))}
      </div>
    </>
  );
}
