import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Label } from '@/components/ui/label';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { parcelSelectLabel } from './utils';

type ParcelSelectionFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  selectedParcelId: string;
  onSelectedParcelIdChange: (value: string) => void;
  parcels: ParcelSearchRow[];
  selectedParcel: ParcelSearchRow | null;
  selectedPrefix: string;
};

export function ParcelSelectionField({
  id,
  label,
  placeholder,
  selectedParcelId,
  onSelectedParcelIdChange,
  parcels,
  selectedParcel,
  selectedPrefix,
}: ParcelSelectionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={selectedParcelId} onValueChange={onSelectedParcelIdChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {parcels.map((parcel) => (
            <SelectItem key={parcel.id} value={parcel.id}>
              <span className="flex flex-wrap items-center gap-2">
                {parcelSelectLabel(parcel)}
                <ParcelStorageFeeBadge storageChargePsw={parcel.storageChargePsw} />
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedParcel ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {selectedPrefix}: {parcelSelectLabel(selectedParcel)}
          </span>
          <ParcelStorageFeeBadge storageChargePsw={selectedParcel.storageChargePsw} />
        </div>
      ) : null}
    </div>
  );
}
