import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWhatsAppTemplateEditor } from '../hooks';
import type { WhatsAppEventTemplate } from '../types';

export function WhatsAppTemplateDialog({
  event,
  onClose,
}: {
  event: WhatsAppEventTemplate;
  onClose: () => void;
}) {
  const editor = useWhatsAppTemplateEditor(event, onClose);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event.name} template</DialogTitle>
          <DialogDescription>
            Enter the name and language of the template exactly as approved in Meta WhatsApp Manager
            ({event.category} category).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Suggested template body to submit to Meta</p>
            <p className="whitespace-pre-wrap">{event.suggestedTemplateBody}</p>
            {event.suggestedButton ? (
              <p className="text-muted-foreground">Button: {event.suggestedButton}</p>
            ) : null}
            <p className="text-muted-foreground">
              Placeholders in order:{' '}
              {event.bodyParams.map((param, i) => `{{${i + 1}}} ${param}`).join(', ')}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wa-template-name">Template name</Label>
              <Input
                id="wa-template-name"
                value={editor.templateName}
                placeholder={event.defaultTemplateName}
                onChange={(e) => editor.setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-template-language">Language code</Label>
              <Input
                id="wa-template-language"
                value={editor.language}
                placeholder={event.defaultLanguage}
                onChange={(e) => editor.setLanguage(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={editor.isSaving}>
            Cancel
          </Button>
          <Button onClick={editor.submit} disabled={editor.isSaving}>
            {editor.isSaving ? 'Saving...' : 'Save template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
