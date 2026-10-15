import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { limitPhoneDigits } from '@/lib/phone';
import type { SelfServiceDraft } from '../api/self-service-agent.api';
import { useSelfServiceCustomerEditor } from '../hooks';

export function SelfServiceCustomerDialog({
  draft,
  canEdit,
  onClose,
}: {
  draft: SelfServiceDraft;
  canEdit: boolean;
  onClose: () => void;
}) {
  const state = useSelfServiceCustomerEditor(draft, onClose);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !state.isSaving) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {draft.parcelContent} · GH₵{(draft.parcelValuePsw / 100).toFixed(2)}
        </p>
        {(['sender', 'receiver'] as const).map((role) => (
          <div key={role} className="space-y-3 rounded-md border p-3">
            <h3 className="font-medium">{role === 'sender' ? 'Sender' : 'Receiver'}</h3>
            {(['fullname', 'phone', 'phone2'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`${role}-${field}`}>
                  {field === 'fullname'
                    ? 'Full name'
                    : field === 'phone'
                      ? 'Phone'
                      : 'Backup phone (optional)'}
                </Label>
                <Input
                  id={`${role}-${field}`}
                  value={state[role][field]}
                  disabled={!canEdit || state.isSaving}
                  maxLength={field === 'fullname' ? 255 : 10}
                  inputMode={field === 'fullname' ? 'text' : 'tel'}
                  onChange={(event) =>
                    state.onChange(
                      role,
                      field,
                      field === 'fullname'
                        ? event.target.value
                        : limitPhoneDigits(event.target.value),
                    )
                  }
                />
              </div>
            ))}
          </div>
        ))}
        {canEdit ? (
          <p className="text-xs text-muted-foreground">
            Changing an existing saved customer requires customer update permission.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={state.isSaving} onClick={onClose}>
            Close
          </Button>
          {canEdit ? (
            <Button disabled={state.isSaving} onClick={() => void state.onSave()}>
              {state.isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
