import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MAX_PARCEL_HANDOVER_NOTE_LENGTH } from '@/shared/shipments/parcel-handover-note';
import { useHandoverNoteDialog } from '../hooks';

export function ParcelHandoverNoteDialog({
  parcelId,
  allowEdit,
  adding,
  onClose,
  onSaved,
}: {
  parcelId: string;
  allowEdit: boolean;
  adding: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const state = useHandoverNoteDialog(parcelId, { allowEdit, adding, onSaved });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !state.saving) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {state.note?.critical ? 'Critical handover note' : 'Parcel handover note'}
          </DialogTitle>
          <DialogDescription>
            Instructions for staff handling the parcel at the receiving branch.
          </DialogDescription>
        </DialogHeader>
        {state.loading ? <p role="status">Loading note…</p> : null}
        {state.error ? (
          <div role="alert" className="space-y-2">
            <p>{state.error}</p>
            <Button variant="outline" onClick={() => void state.retry()}>
              Retry
            </Button>
          </div>
        ) : null}
        {state.note && !state.draft ? (
          <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-sm">
            {state.note.note ?? 'No handover note has been added.'}
          </p>
        ) : null}
        {state.draft ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void state.save();
            }}
          >
            <Label htmlFor="parcel-handover-note">Handover instructions</Label>
            <Textarea
              id="parcel-handover-note"
              value={state.draft.text}
              onChange={(event) => state.change(event.target.value)}
              maxLength={MAX_PARCEL_HANDOVER_NOTE_LENGTH}
              rows={5}
              required
            />
            {state.saveError ? (
              <p role="alert" className="text-sm text-destructive">
                {state.saveError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={adding ? onClose : state.cancel}
                disabled={state.saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={state.saving || !state.draft.text.trim()}>
                {state.saving ? 'Saving…' : 'Save note'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {allowEdit && state.note?.canEdit ? (
              <Button type="button" onClick={state.edit}>
                {state.note.note ? 'Edit note' : 'Add critical note'}
              </Button>
            ) : null}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
