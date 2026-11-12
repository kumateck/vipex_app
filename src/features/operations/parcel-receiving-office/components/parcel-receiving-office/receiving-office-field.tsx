import { useId } from 'react';
import { pickupOfficeLabel, type ReceivingOfficeOption } from '@/shared/shipments/receiving-office';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AUTOMATIC = 'automatic';

export function ReceivingOfficeField({
  options,
  officeId,
  setOfficeId,
  isLoading,
  isError,
  disabled,
  allowAutomatic,
}: {
  options: readonly ReceivingOfficeOption[];
  officeId: string;
  setOfficeId: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
  allowAutomatic?: boolean;
}) {
  const id = useId();
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load receiving offices.
      </p>
    );
  if (isLoading)
    return (
      <p role="status" className="text-sm">
        Loading receiving offices…
      </p>
    );
  if (!options.length) return null;

  return (
    <Field>
      <FieldLabel htmlFor={id}>Receiving office</FieldLabel>
      <Select
        value={officeId || (allowAutomatic ? AUTOMATIC : '')}
        onValueChange={(value) => setOfficeId(value === AUTOMATIC ? '' : value)}
      >
        <SelectTrigger id={id} disabled={disabled}>
          <SelectValue placeholder="Select receiving office" />
        </SelectTrigger>
        <SelectContent>
          {allowAutomatic ? (
            <SelectItem value={AUTOMATIC}>Use the location’s only office</SelectItem>
          ) : null}
          {options.map((office) => (
            <SelectItem key={office.id} value={office.id}>
              {pickupOfficeLabel(office.locationName, office.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
