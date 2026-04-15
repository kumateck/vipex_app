import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';

const issueQuantitySchema = z.object({
  quantity: z.string().regex(/^\d+$/, 'Enter a valid whole number'),
  unitOfMeasure: z.number().int().min(0).max(7),
});

type IssueQuantityFormValues = z.infer<typeof issueQuantitySchema>;

type UnitConversion = {
  unitOfMeasure: number;
  factorToBase: string;
};

type StockRequestIssueQuantityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  remainingBase: number;
  availableBase: number;
  unitConversions: UnitConversion[];
  initialIssueBase: number;
  onConfirm: (issueBase: number) => void;
};

export function StockRequestIssueQuantityDialog({
  open,
  onOpenChange,
  productId,
  productName,
  remainingBase,
  availableBase,
  unitConversions,
  initialIssueBase,
  onConfirm,
}: StockRequestIssueQuantityDialogProps) {
  const maxIssueBase = Math.max(0, Math.min(remainingBase, availableBase));
  const conversionRows = useMemo(
    () =>
      unitConversions.map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number.parseInt(item.factorToBase, 10),
      })),
    [unitConversions],
  );
  const unitOptions = useMemo(
    () =>
      unitConversions
        .map((item) =>
          UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure),
        )
        .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item)),
    [unitConversions],
  );
  const formatInAllUnits = (baseQuantity: number) => {
    const sorted = [...conversionRows].sort((a, b) => b.factorToBase - a.factorToBase);
    return sorted
      .filter((item) => item.factorToBase > 0)
      .map((item) => {
        const option = UNIT_OF_MEASURE_OPTIONS.find((unit) => unit.value === item.unitOfMeasure);
        const unitLabel = option?.label?.toLowerCase() ?? String(item.unitOfMeasure);
        const raw = baseQuantity / item.factorToBase;
        const quantity = Number.isInteger(raw) ? String(raw) : raw.toFixed(2).replace(/\.?0+$/, '');
        return `${quantity} ${unitLabel}`;
      })
      .join(' | ');
  };

  const defaultUnit = unitConversions[0]?.unitOfMeasure ?? 0;
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueQuantityFormValues>({
    resolver: zodResolver(issueQuantitySchema),
    defaultValues: {
      quantity: initialIssueBase > 0 ? String(initialIssueBase) : '',
      unitOfMeasure: defaultUnit,
    },
  });

  const watchedQuantity = watch('quantity');
  const watchedUnit = watch('unitOfMeasure');
  const hasWatchedUnitConversion = conversionRows.some(
    (item) => item.unitOfMeasure === watchedUnit,
  );
  const resolvedUnit = hasWatchedUnitConversion ? watchedUnit : defaultUnit;

  useEffect(() => {
    if (!conversionRows.length) return;
    if (!hasWatchedUnitConversion) {
      setValue('unitOfMeasure', defaultUnit, { shouldValidate: true });
    }
  }, [conversionRows, defaultUnit, hasWatchedUnitConversion, setValue]);

  useEffect(() => {
    setQuantityError(null);
    reset({
      quantity: initialIssueBase > 0 ? String(initialIssueBase) : '',
      unitOfMeasure: defaultUnit,
    });
  }, [defaultUnit, initialIssueBase, productId, reset]);

  const previewBase = useMemo(() => {
    if (!watchedQuantity) return 0;
    const parsedQuantity = Number.parseInt(watchedQuantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return 0;
    const hasUnit = conversionRows.some((item) => item.unitOfMeasure === resolvedUnit);
    if (!hasUnit) return 0;
    try {
      return convertToBaseUnits(parsedQuantity, resolvedUnit, conversionRows);
    } catch {
      return 0;
    }
  }, [conversionRows, resolvedUnit, watchedQuantity]);

  const submit = (values: IssueQuantityFormValues) => {
    const parsedQuantity = Number.parseInt(values.quantity, 10);
    const selectedUnit = conversionRows.some((item) => item.unitOfMeasure === values.unitOfMeasure)
      ? values.unitOfMeasure
      : defaultUnit;
    const hasUnit = conversionRows.some((item) => item.unitOfMeasure === selectedUnit);
    if (!hasUnit) {
      setQuantityError('Selected unit is unavailable for this product.');
      return;
    }
    const issueBase = convertToBaseUnits(parsedQuantity, selectedUnit, conversionRows);
    if (issueBase <= 0) {
      setQuantityError('Issue quantity must be greater than zero.');
      return;
    }
    if (issueBase > maxIssueBase) {
      setQuantityError('Issue quantity exceeds available/remaining quantity.');
      return;
    }
    setQuantityError(null);
    onConfirm(issueBase);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setQuantityError(null);
          reset({
            quantity: initialIssueBase > 0 ? String(initialIssueBase) : '',
            unitOfMeasure: defaultUnit,
          });
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Issue Quantity</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>Remaining: {formatBaseQuantityWithBestUnits(String(remainingBase), conversionRows)}</p>
          <p className="text-xs text-muted-foreground">
            In all units: {formatInAllUnits(remainingBase)}
          </p>
          <p>
            Available at issuing store:{' '}
            {formatBaseQuantityWithBestUnits(String(availableBase), conversionRows)}
          </p>
          <p className="text-xs text-muted-foreground">
            In all units: {formatInAllUnits(availableBase)}
          </p>
          <p>
            Max issue now: {formatBaseQuantityWithBestUnits(String(maxIssueBase), conversionRows)}
          </p>
          <p className="text-xs text-muted-foreground">
            In all units: {formatInAllUnits(maxIssueBase)}
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
              <Input id="quantity" placeholder="e.g. 2" {...register('quantity')} />
              {errors.quantity?.message ? (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="unitOfMeasure">Unit</FieldLabel>
              <Controller
                control={control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <Select
                    value={String(field.value ?? defaultUnit)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="unitOfMeasure">
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
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">Converted to base: {previewBase}</p>
          {quantityError ? <p className="text-sm text-destructive">{quantityError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Set quantity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
