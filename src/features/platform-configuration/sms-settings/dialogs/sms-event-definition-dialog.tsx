import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useSmsEventEditor } from '../hooks';
import type { CompanySmsEventDefinition } from '../types';

export function SmsEventDefinitionDialog({
  event,
  onClose,
}: {
  event: CompanySmsEventDefinition;
  onClose: () => void;
}) {
  const editor = useSmsEventEditor(event);

  const save = async () => {
    if (await editor.save()) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {event.name}</DialogTitle>
          <DialogDescription>
            This message is dispatched automatically. Only the message body can be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p>
              <span className="font-medium">Dispatch:</span> {event.dispatchAction}
            </p>
            <p>
              <span className="font-medium">Recipient:</span> {event.recipient}
            </p>
          </div>
          <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea
              rows={6}
              value={editor.body}
              onChange={(changeEvent) => editor.setBody(changeEvent.target.value)}
              maxLength={2000}
            />
          </Field>
          <div className="space-y-2">
            <p className="text-sm font-medium">Available variables</p>
            <div className="flex flex-wrap gap-2">
              {event.variables.map((variable) => (
                <Button
                  key={variable}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 font-mono text-xs"
                  onClick={() => editor.insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={!editor.isDirty || editor.isLoading}
          >
            {editor.isLoading ? 'Saving...' : 'Save definition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
