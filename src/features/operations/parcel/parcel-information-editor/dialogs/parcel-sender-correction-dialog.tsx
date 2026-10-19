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
import { Textarea } from '@/components/ui/textarea';
import type { useParcelSenderCorrection } from '../hooks';

export function ParcelSenderCorrectionDialog({
  correction,
}: {
  correction: ReturnType<typeof useParcelSenderCorrection>;
}) {
  return (
    <Dialog
      open={correction.open}
      onOpenChange={(open) => {
        if (!open) correction.close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Correct sender customer</DialogTitle>
          <DialogDescription>
            Find the correct number and select its existing customer. This changes only this
            parcel’s sender association.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="correct-sender-phone">Correct sender telephone</Label>
          <div className="flex gap-2">
            <Input
              id="correct-sender-phone"
              value={correction.telephone}
              onChange={(event) => correction.changeTelephone(event.target.value)}
              maxLength={10}
              inputMode="numeric"
              disabled={correction.isSaving}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void correction.lookup()}
              disabled={
                correction.isFetching || correction.isSaving || correction.telephone.length !== 10
              }
            >
              Find customer
            </Button>
          </div>
          {correction.matches?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No existing customer matches this number. Check the number before continuing.
            </p>
          ) : null}
          <div className="space-y-2">
            {correction.matches?.map((customer) => (
              <label key={customer.id} className="flex items-center gap-3 rounded-md border p-3">
                <input
                  type="radio"
                  name="correct-sender"
                  checked={correction.selected === customer.id}
                  onChange={() => correction.setSelected(customer.id)}
                  disabled={correction.isSaving}
                />
                <span>
                  <span className="block font-medium">{customer.fullname}</span>
                  <span className="text-sm text-muted-foreground">
                    {[customer.telephone, customer.telephone2].filter(Boolean).join(' / ')}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Label htmlFor="sender-correction-reason">Correction reason</Label>
          <Textarea
            id="sender-correction-reason"
            value={correction.reason}
            onChange={(event) => correction.setReason(event.target.value)}
            maxLength={1000}
            disabled={correction.isSaving}
            placeholder="Explain the mistaken sender number"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={correction.close}
            disabled={correction.isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void correction.save()}
            disabled={
              !correction.selected ||
              correction.reason.trim().length < 5 ||
              correction.isSaving ||
              correction.isFetching
            }
          >
            {correction.isSaving ? 'Saving…' : 'Link selected sender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
