import { Controller, type Control, type UseFormRegister } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { AcknowledgeStockTransferReceiptFormValues } from '../../schemas/stock-forms.schema';

interface StockTransferReceiveVarianceFieldProps {
  quantityId: 'damagedQuantity' | 'missingQuantity';
  unitId: 'damagedQuantityUnitOfMeasure' | 'missingQuantityUnitOfMeasure';
  label: string;
  register: UseFormRegister<AcknowledgeStockTransferReceiptFormValues>;
  control: Control<AcknowledgeStockTransferReceiptFormValues>;
  quantityError?: string;
  unitOptions: { value: number; label: string }[];
  baseUnitOfMeasure: number;
}

export function StockTransferReceiveVarianceField({
  quantityId,
  unitId,
  label,
  register,
  control,
  quantityError,
  unitOptions,
  baseUnitOfMeasure,
}: StockTransferReceiveVarianceFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={quantityId}>{label}</FieldLabel>
      <div className="grid gap-2 md:grid-cols-2">
        <Input
          id={quantityId}
          placeholder="0"
          aria-invalid={!!quantityError}
          {...register(quantityId)}
        />
        <Controller
          control={control}
          name={unitId}
          render={({ field }) => (
            <Select
              value={String(field.value ?? baseUnitOfMeasure)}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger id={unitId}>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      {quantityError ? <p className="text-sm text-destructive">{quantityError}</p> : null}
    </Field>
  );
}
