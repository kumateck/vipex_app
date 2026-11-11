import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import type { CorrectionParcel as Parcel, CorrectionParty } from '../../types';
import { correctionPartyLabels } from '../../utils';
import { CorrectionEditor } from '../correction-editor';

export function CorrectionParcel({
  parcel,
  onSaved,
}: {
  parcel: Parcel;
  onSaved: (parcel: Parcel) => void;
}) {
  const [party, setParty] = useState<CorrectionParty>('receiver');
  const customer = parcel.parties[party];
  return (
    <section className="space-y-5" aria-label="Parcel customer correction">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-4">
        <div>
          <h2 className="font-semibold">{parcel.bookingCode}</h2>
          <p className="text-sm text-muted-foreground">{parcel.trackingCode}</p>
        </div>
        <p className="text-sm">{parcelStatusLabel(parcel.status)}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="correction-party">Customer to correct</Label>
        <Select value={party} onValueChange={(value) => setParty(value as CorrectionParty)}>
          <SelectTrigger id="correction-party">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(correctionPartyLabels) as CorrectionParty[]).map((key) => (
              <SelectItem key={key} value={key} disabled={!parcel.parties[key]}>
                {correctionPartyLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {customer ? (
        <dl className="grid gap-3 rounded-md bg-muted/50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Recorded parcel name</dt>
            <dd className="break-words font-medium">{customer.recordedName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Customer profile name</dt>
            <dd className="break-words">{customer.fullname}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Primary telephone</dt>
            <dd>{customer.telephone || 'None'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Secondary telephone</dt>
            <dd>{customer.telephone2 || 'None'}</dd>
          </div>
        </dl>
      ) : null}
      {parcel.restriction ? (
        <p role="alert" className="text-sm text-destructive">
          {parcel.restriction}
        </p>
      ) : customer ? (
        <CorrectionEditor
          key={`${parcel.version}:${party}`}
          parcel={parcel}
          party={party}
          onSaved={onSaved}
        />
      ) : (
        <p role="alert">The linked customer is inactive or missing. Contact support.</p>
      )}
    </section>
  );
}
