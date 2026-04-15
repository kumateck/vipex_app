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
  acknowledgeStockRequestLineReceiptSchema,
  type StockRequestLineReceiptAcknowledgeFormValues,
} from '../../schemas/stock-forms.schema';
import { StockRequestAcknowledgeVarianceField } from './stock-request-acknowledge-variance-field';

interface StockRequestAcknowledgeFormProps {
  requestId: string;
  lineId: string;
  pendingAckBase: number;
  conversionRows: { unitOfMeasure: number; factorToBase: number }[];
  baseUnitOfMeasure: number;
  isSubmitting: boolean;
  onSubmit: (values: {
    lineId: string;
    acknowledgedQuantity: string;
    notes?: string;
  }) => Promise<void>;
}

export function StockRequestAcknowledgeForm({
  requestId,
  lineId,
  pendingAckBase,
  conversionRows,
  baseUnitOfMeasure,
  isSubmitting,
  onSubmit,
}: StockRequestAcknowledgeFormProps) {
  const unitOptions = useMemo(() => {
    const fallback = [{ unitOfMeasure: baseUnitOfMeasure, factorToBase: 1 }];
    const conversions = conversionRows.length > 0 ? conversionRows : fallback;
    return [...conversions]
      .sort((a, b) => a.factorToBase - b.factorToBase)
      .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
      .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  }, [baseUnitOfMeasure, conversionRows]);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<StockRequestLineReceiptAcknowledgeFormValues>({
    resolver: zodResolver(acknowledgeStockRequestLineReceiptSchema),
    defaultValues: {
      lineId,
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
    setValue('lineId', lineId);
    setValue('partialQuantityUnitOfMeasure', baseUnitOfMeasure);
    setValue('damagedQuantityUnitOfMeasure', baseUnitOfMeasure);
    setValue('missingQuantityUnitOfMeasure', baseUnitOfMeasure);
  }, [baseUnitOfMeasure, lineId, setValue]);

  const receiveMode = watch('receiveMode');
  const partialReceivedQuantity = watch('partialReceivedQuantity');
  const partialQuantityUnitOfMeasure = watch('partialQuantityUnitOfMeasure');
  const damagedQuantity = watch('damagedQuantity');
  const damagedQuantityUnitOfMeasure = watch('damagedQuantityUnitOfMeasure');
  const missingQuantity = watch('missingQuantity');
  const missingQuantityUnitOfMeasure = watch('missingQuantityUnitOfMeasure');

  const receivedBase = useMemo(() => {
    if (receiveMode === 'full') return pendingAckBase;
    const qty = Number.parseFloat(partialReceivedQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(
      qty,
      partialQuantityUnitOfMeasure ?? baseUnitOfMeasure,
      conversionRows,
    );
  }, [
    baseUnitOfMeasure,
    conversionRows,
    partialQuantityUnitOfMeasure,
    partialReceivedQuantity,
    pendingAckBase,
    receiveMode,
  ]);
  const damagedBase = useMemo(() => {
    const qty = Number.parseFloat(damagedQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(
      qty,
      damagedQuantityUnitOfMeasure ?? baseUnitOfMeasure,
      conversionRows,
    );
  }, [baseUnitOfMeasure, conversionRows, damagedQuantity, damagedQuantityUnitOfMeasure]);
  const missingBase = useMemo(() => {
    const qty = Number.parseFloat(missingQuantity || '0');
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    return convertToBaseUnits(
      qty,
      missingQuantityUnitOfMeasure ?? baseUnitOfMeasure,
      conversionRows,
    );
  }, [baseUnitOfMeasure, conversionRows, missingQuantity, missingQuantityUnitOfMeasure]);

  const acknowledgedBase = Math.max(0, receivedBase - damagedBase - missingBase);
  const pendingAfterBase = Math.max(0, pendingAckBase - receivedBase);

  const submit = async (values: StockRequestLineReceiptAcknowledgeFormValues) => {
    if (pendingAckBase <= 0) return toast.error('No fulfilled quantity pending acknowledgement');
    if (receivedBase <= 0) return toast.error('Received quantity must be greater than zero');
    if (receivedBase > pendingAckBase)
      return toast.error('Received quantity exceeds pending acknowledgement quantity');
    if (damagedBase + missingBase > receivedBase)
      return toast.error('Damaged + missing cannot exceed received quantity');
    if (acknowledgedBase <= 0)
      return toast.error('Acknowledged quantity after deductions must be greater than zero');

    const varianceNote =
      damagedBase > 0 || missingBase > 0
        ? `Variance: damaged ${formatBaseQuantityWithBestUnits(String(damagedBase), conversionRows)}, missing ${formatBaseQuantityWithBestUnits(String(missingBase), conversionRows)}`
        : '';
    const composedNotes = [values.notes ?? '', varianceNote].filter(Boolean).join('\n');

    await onSubmit({
      lineId: values.lineId,
      acknowledgedQuantity: String(acknowledgedBase),
      notes: composedNotes || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt acknowledgement</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <input type="hidden" {...register('lineId')} />
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
                <span className="font-medium">Acknowledged (auto):</span>{' '}
                {formatBaseQuantityWithBestUnits(String(acknowledgedBase), conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending after this acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(pendingAfterBase), conversionRows)}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <StockRequestAcknowledgeVarianceField
                quantityId="damagedQuantity"
                unitId="damagedQuantityUnitOfMeasure"
                label="Damaged quantity (optional)"
                register={register}
                control={control}
                unitOptions={unitOptions}
                baseUnitOfMeasure={baseUnitOfMeasure}
              />
              <StockRequestAcknowledgeVarianceField
                quantityId="missingQuantity"
                unitId="missingQuantityUnitOfMeasure"
                label="Missing quantity (optional)"
                register={register}
                control={control}
                unitOptions={unitOptions}
                baseUnitOfMeasure={baseUnitOfMeasure}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    id="notes"
                    placeholder="Optional receiving remarks (include missing/damaged details)"
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
                <Link to={`/inventory/stock-requests/view/${requestId}`}>Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
