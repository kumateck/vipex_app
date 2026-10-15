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
import { Textarea } from '@/components/ui/textarea';
import { limitPhoneDigits } from '@/lib/phone';
import type { SelfServiceDraft } from '../api/self-service-agent.api';
import { useSelfServiceDraftEditor } from '../hooks';

export function SelfServiceDraftDialog({
  draft,
  canEdit,
  onClose,
}: {
  draft: SelfServiceDraft;
  canEdit: boolean;
  onClose: () => void;
}) {
  const state = useSelfServiceDraftEditor(draft, onClose);
  const disabled = !canEdit || state.isSaving;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !state.isSaving) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
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
                  disabled={disabled}
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
        <div className="space-y-3 rounded-md border p-3">
          <h3 className="font-medium">Parcel</h3>
          <div className="space-y-1">
            <Label htmlFor="parcel-content">Contents</Label>
            <Textarea
              id="parcel-content"
              value={state.parcel.content}
              disabled={disabled}
              maxLength={255}
              onChange={(event) => state.onParcelChange('content', event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parcel-value">Declared value (GH₵)</Label>
            <Input
              id="parcel-value"
              value={state.parcel.value}
              disabled={disabled}
              inputMode="decimal"
              placeholder="0.00"
              onChange={(event) => state.onParcelChange('value', event.target.value)}
            />
          </div>
          {canEdit && state.parcelError ? (
            <p className="text-xs text-destructive">{state.parcelError}</p>
          ) : null}
        </div>
        {canEdit ? (
          <p className="text-xs text-muted-foreground">
            Changing an existing saved customer requires customer update permission. The destination
            is chosen on the completion form.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={state.isSaving} onClick={onClose}>
            Close
          </Button>
          {canEdit ? (
            <Button
              disabled={state.isSaving || Boolean(state.parcelError)}
              onClick={() => void state.onSave()}
            >
              {state.isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
