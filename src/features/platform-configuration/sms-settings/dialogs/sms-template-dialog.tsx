import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSmsTemplateForm } from '../hooks';
import type { CompanySmsTemplate } from '../types';
import { BULK_SMS_VARIABLES } from '../utils';

export function SmsTemplateDialog({
  template,
  onClose,
}: {
  template?: CompanySmsTemplate | null;
  onClose: () => void;
}) {
  const form = useSmsTemplateForm(template, onClose);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.isEditing ? 'Edit SMS Template' : 'Add SMS Template'}</DialogTitle>
          <DialogDescription>
            Reusable templates can be selected when creating a bulk SMS campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Template name</FieldLabel>
            <Input
              value={form.draft.name}
              onChange={(event) => form.updateDraft({ name: event.target.value })}
              placeholder="Customer announcement"
            />
          </Field>
          <Field>
            <FieldLabel>Template code</FieldLabel>
            <Input
              value={form.draft.code}
              onChange={(event) => form.updateDraft({ code: event.target.value })}
              placeholder="customer_announcement"
              disabled={form.isEditing}
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>Message</FieldLabel>
            <Textarea
              rows={7}
              value={form.draft.body}
              onChange={(event) => form.updateDraft({ body: event.target.value })}
              maxLength={2000}
              placeholder="Hello {{recipientName}}, ..."
            />
          </Field>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">Available bulk SMS variables</p>
            <div className="flex flex-wrap gap-2">
              {BULK_SMS_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 font-mono text-xs"
                  onClick={() => form.insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
            <FieldLabel htmlFor="sms-template-active" className="mb-0">
              Template active
            </FieldLabel>
            <Checkbox
              id="sms-template-active"
              checked={form.draft.isActive}
              onCheckedChange={(checked) => form.updateDraft({ isActive: checked === true })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void form.save()} disabled={form.isSaving}>
            {form.isSaving ? 'Saving...' : form.isEditing ? 'Save changes' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
