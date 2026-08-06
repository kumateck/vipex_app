import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBulkSmsComposer } from '../hooks';
import type { CompanySmsTemplate } from '../types';
import { BulkSmsDialogFields } from './bulk-sms-dialog-fields';

export function BulkSmsDialog({
  open,
  templates,
  onOpenChange,
}: {
  open: boolean;
  templates: CompanySmsTemplate[];
  onOpenChange: (open: boolean) => void;
}) {
  const composer = useBulkSmsComposer(templates, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Bulk SMS</DialogTitle>
          <DialogDescription>
            Select a saved SMS template or write a one-off message, then choose the audience.
          </DialogDescription>
        </DialogHeader>

        <BulkSmsDialogFields composer={composer} templates={templates} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void composer.create(false)}
            disabled={composer.isLoading}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => void composer.create(true)}
            disabled={composer.isLoading}
          >
            {composer.isLoading ? 'Creating...' : 'Create & submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
