import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PHONE_DIGITS } from '@/lib/phone';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ReturnTypeMainReceiverChange } from './parcel-main-receiver-types';

export function ParcelMainReceiverFields({
  parcel,
  change,
}: {
  parcel: ParcelSearchRow;
  change: ReturnTypeMainReceiverChange;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="text-sm">
        <p className="font-medium">Current main receiver</p>
        <p>Receiver: {parcel.receiverName ?? '—'}</p>
        <p className="text-muted-foreground">
          Tel:{' '}
          {[parcel.receiverPhone, parcel.receiverPhone2].filter(Boolean).join(' / ') ||
            'No telephone'}
        </p>
      </div>
      <Button
        type="button"
        variant={change.enabled ? 'default' : 'outline'}
        onClick={() => change.setEnabled(!change.enabled)}
      >
        {change.enabled ? 'Changing Main Receiver' : 'Change Main Receiver'}
      </Button>
      {change.enabled && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-main-receiver-phone">New receiver telephone</Label>
            <Input
              id="new-main-receiver-phone"
              value={change.telephone}
              onChange={(event) => change.changeTelephone(event.target.value)}
              inputMode="numeric"
              maxLength={PHONE_DIGITS}
              autoComplete="tel"
              placeholder="10-digit telephone"
            />
          </div>
          {change.isLookingUp && (
            <p className="text-sm text-muted-foreground">Looking up customer…</p>
          )}
          {change.lookupFailed && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive">Telephone lookup failed.</p>
              <Button type="button" variant="outline" size="sm" onClick={change.retryLookup}>
                Retry
              </Button>
            </div>
          )}
          {change.lookupDone && change.existing && (
            <p className="text-sm">
              Existing customer: <strong>{change.existing.fullname}</strong>
            </p>
          )}
          {change.lookupDone && change.existing?.id === parcel.receiverId && (
            <p className="text-sm text-destructive">This is already the main receiver.</p>
          )}
          {change.lookupDone && !change.existing && (
            <div className="space-y-2">
              <Label htmlFor="new-main-receiver-name">New receiver name</Label>
              <Input
                id="new-main-receiver-name"
                value={change.fullname}
                onChange={(event) => change.setFullname(event.target.value)}
                placeholder="Full name"
                maxLength={255}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
