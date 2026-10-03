import type { FormEvent } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import type { ParcelSecondReceiverState } from '../hooks/use-parcel-second-receiver';
import { ParcelSecondReceiverRemoveConfirm } from './parcel-second-receiver-remove-confirm';

export function ParcelSecondReceiverDialog({ state }: { state: ParcelSecondReceiverState }) {
  const { parcel, isSaving } = state;
  const hasExisting = Boolean(parcel?.secondReceiverName || parcel?.secondReceiverPhone);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void state.save();
  };

  return (
    <Dialog open={Boolean(parcel)} onOpenChange={(open) => (!open ? state.close() : null)}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {hasExisting ? 'Change Second Receiver' : 'Add Second Receiver'}
            </DialogTitle>
            <DialogDescription>
              {parcel ? `Booking: ${parcel.bookingCode}. ` : ''}
              The second receiver may collect this parcel on behalf of the main receiver
              {parcel?.receiverName ? ` (${parcel.receiverName})` : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="parcel-second-receiver-name">Second Receiver Name</Label>
            <Input
              id="parcel-second-receiver-name"
              value={state.fullname}
              onChange={(event) => state.setFullname(event.target.value)}
              placeholder="Full name"
              maxLength={255}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcel-second-receiver-phone">Second Receiver Telephone</Label>
            <Input
              id="parcel-second-receiver-phone"
              value={state.telephone}
              onChange={(event) => state.setTelephone(limitPhoneDigits(event.target.value))}
              placeholder="Telephone number"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_DIGITS}
            />
            <p className="text-xs text-muted-foreground">
              If this telephone already belongs to a customer, that customer is used.
            </p>
          </div>

          {state.confirmingRemove ? <ParcelSecondReceiverRemoveConfirm state={state} /> : null}

          <DialogFooter className="gap-2 sm:justify-between">
            {hasExisting ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => state.setConfirmingRemove(true)}
                disabled={isSaving || state.confirmingRemove}
              >
                Remove Second Receiver
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={state.close} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || state.confirmingRemove}>
                {isSaving ? <Spinner /> : null}
                Save Second Receiver
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
