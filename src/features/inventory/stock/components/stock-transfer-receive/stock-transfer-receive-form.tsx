import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import {
  acknowledgeStockTransferReceiptSchema,
  type AcknowledgeStockTransferReceiptFormValues,
} from '../../schemas/stock-forms.schema';
import type { StockTransfer } from '../../types/inventory-stock.types';
import { StockTransferReceiveVarianceField } from './stock-transfer-receive-variance-field';

interface StockTransferReceiveFormProps {
  transfer: StockTransfer;
  conversionRows: { unitOfMeasure: number; factorToBase: number }[];
  baseUnitOfMeasure: number;
  pendingAckBase: number;
  isSubmitting: boolean;
  onSubmit: (values: {
    acceptedQuantity: string;
    damagedQuantity?: string;
    missingQuantity?: string;
    notes?: string;
  }) => Promise<void>;
}

export function StockTransferReceiveForm({
  transfer,
  conversionRows,
  baseUnitOfMeasure,
  pendingAckBase,
  isSubmitting,
  onSubmit,
}: StockTransferReceiveFormProps) {
  const unitOptions = useMemo(() => {
    const fallback = [{ unitOfMeasure: baseUnitOfMeasure, factorToBase: 1 }];
    const conversions = conversionRows.length > 0 ? conversionRows : fallback;

    return [...conversions]
      .sort((a, b) => a.factorToBase - b.factorToBase)
      .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
      .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  }, [baseUnitOfMeasure, conversionRows]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcknowledgeStockTransferReceiptFormValues>({
    resolver: zodResolver(acknowledgeStockTransferReceiptSchema),
    defaultValues: {
      receiveMode: 'full',
      partialReceivedQuantity: '',
      partialQuantityUnitOfMeasure: baseUnitOfMeasure,
      damagedQuantity: '',
      damagedQuantityUnitOfMeasure: baseUnitOfMeasure,
      missingQuantity: '',
      missingQuantityUnitOfMeasure: baseUnitOfMeasure,
      notes: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    setValue('partialQuantityUnitOfMeasure', baseUnitOfMeasure);
    setValue('damagedQuantityUnitOfMeasure', baseUnitOfMeasure);
    setValue('missingQuantityUnitOfMeasure', baseUnitOfMeasure);
  }, [baseUnitOfMeasure, setValue]);

  const receiveMode = watch('receiveMode');
  const partialReceivedQuantity = watch('partialReceivedQuantity');
  const partialQuantityUnit = watch('partialQuantityUnitOfMeasure');
  const damagedQuantity = watch('damagedQuantity');
  const damagedQuantityUnit = watch('damagedQuantityUnitOfMeasure');
  const missingQuantity = watch('missingQuantity');
  const missingQuantityUnit = watch('missingQuantityUnitOfMeasure');

  const receivedBase = useMemo(() => {
    if (receiveMode === 'full') return pendingAckBase;
    const qty = Number.parseFloat(partialReceivedQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(qty, partialQuantityUnit ?? baseUnitOfMeasure, conversionRows);
  }, [
    baseUnitOfMeasure,
    conversionRows,
    partialQuantityUnit,
    partialReceivedQuantity,
    pendingAckBase,
    receiveMode,
  ]);

  const damagedBase = useMemo(() => {
    const qty = Number.parseFloat(damagedQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(qty, damagedQuantityUnit ?? baseUnitOfMeasure, conversionRows);
  }, [baseUnitOfMeasure, conversionRows, damagedQuantity, damagedQuantityUnit]);

  const missingBase = useMemo(() => {
    const qty = Number.parseFloat(missingQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(qty, missingQuantityUnit ?? baseUnitOfMeasure, conversionRows);
  }, [baseUnitOfMeasure, conversionRows, missingQuantity, missingQuantityUnit]);

  const acceptedBase = Math.max(0, receivedBase - damagedBase - missingBase);
  const remainingAfterAckBase = Math.max(0, pendingAckBase - receivedBase);

  const submit = async (values: AcknowledgeStockTransferReceiptFormValues) => {
    if (pendingAckBase <= 0) {
      toast.error('No fulfilled quantity pending receipt acknowledgement');
      return;
    }
    if (receivedBase <= 0) {
      toast.error('Received quantity must be greater than zero');
      return;
    }
    if (receivedBase > pendingAckBase) {
      toast.error('Received quantity exceeds pending receipt acknowledgement quantity');
      return;
    }
    if (damagedBase + missingBase > receivedBase) {
      toast.error('Damaged + missing cannot exceed received quantity');
      return;
    }
    if (acceptedBase <= 0) {
      toast.error('Accepted quantity after deductions must be greater than zero');
      return;
    }

    await onSubmit({
      acceptedQuantity: String(acceptedBase),
      damagedQuantity: damagedBase > 0 ? String(damagedBase) : undefined,
      missingQuantity: missingBase > 0 ? String(missingBase) : undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receiving acknowledgement</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="receiveMode">Acknowledgement mode</FieldLabel>
              <Controller
                control={control}
                name="receiveMode"
                render={({ field }) => (
                  <Select value={field.value ?? 'full'} onValueChange={field.onChange}>
                    <SelectTrigger id="receiveMode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full receipt</SelectItem>
                      <SelectItem value="partial">Partial receipt</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {receiveMode === 'partial' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="partialReceivedQuantity">Received quantity</FieldLabel>
                  <Input
                    id="partialReceivedQuantity"
                    placeholder="e.g. 20"
                    aria-invalid={!!errors.partialReceivedQuantity}
                    {...register('partialReceivedQuantity')}
                  />
                  {errors.partialReceivedQuantity?.message ? (
                    <p className="text-sm text-destructive">
                      {errors.partialReceivedQuantity.message}
                    </p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="partialQuantityUnitOfMeasure">Received unit</FieldLabel>
                  <Controller
                    control={control}
                    name="partialQuantityUnitOfMeasure"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? baseUnitOfMeasure)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger id="partialQuantityUnitOfMeasure">
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
            ) : null}

            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Received:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(receivedBase), conversionRows)}
              </p>
              <p>
                <span className="font-medium">Damaged:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(damagedBase), conversionRows)}
              </p>
              <p>
                <span className="font-medium">Missing:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(missingBase), conversionRows)}
              </p>
              <p>
                <span className="font-medium">Accepted (auto):</span>{' '}
                {formatBaseQuantityWithBestUnits(String(acceptedBase), conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending after this acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(remainingAfterAckBase), conversionRows)}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <StockTransferReceiveVarianceField
                quantityId="damagedQuantity"
                unitId="damagedQuantityUnitOfMeasure"
                label="Damaged quantity (optional)"
                register={register}
                control={control}
                quantityError={errors.damagedQuantity?.message}
                unitOptions={unitOptions}
                baseUnitOfMeasure={baseUnitOfMeasure}
              />
              <StockTransferReceiveVarianceField
                quantityId="missingQuantity"
                unitId="missingQuantityUnitOfMeasure"
                label="Missing quantity (optional)"
                register={register}
                control={control}
                quantityError={errors.missingQuantity?.message}
                unitOptions={unitOptions}
                baseUnitOfMeasure={baseUnitOfMeasure}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Receiving notes</FieldLabel>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    id="notes"
                    placeholder="Optional receiving notes"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? 'Saving...' : 'Acknowledge Receipt'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/inventory/stock-transfers/edit/${transfer.id}`}>Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
