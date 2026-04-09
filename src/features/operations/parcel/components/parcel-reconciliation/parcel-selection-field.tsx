import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Label } from '@/components/ui/label';
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
              {parcelSelectLabel(parcel)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedParcel ? (
        <p className="text-xs text-muted-foreground">
          {selectedPrefix}: {parcelSelectLabel(selectedParcel)}
        </p>
      ) : null}
    </div>
  );
}
