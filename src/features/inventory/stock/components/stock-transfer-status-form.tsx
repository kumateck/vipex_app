import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { STOCK_TRANSFER_STATUS_OPTIONS } from '../constants/stock-options';
import { updateStockTransferSchema, type UpdateStockTransferFormValues } from '../schemas/stock-forms.schema';
import type { StockTransfer } from '../types/inventory-stock.types';

interface StockTransferStatusFormProps {
  transfer: StockTransfer;
  onSubmit: (data: UpdateStockTransferFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
  productNameById?: ReadonlyMap<string, string>;
  locationNameById?: ReadonlyMap<string, string>;
}

export function StockTransferStatusForm({
  transfer,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
  productNameById,
  locationNameById,
}: StockTransferStatusFormProps) {
  const navigate = useNavigate();
  const defaultStatus = useMemo(() => transfer.status ?? 0, [transfer.status]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateStockTransferFormValues>({
    resolver: zodResolver(updateStockTransferSchema),
    defaultValues: { status: defaultStatus },
    mode: 'onSubmit',
  });

  const productName = productNameById?.get(transfer.productId) ?? transfer.productId;
  const fromLocationName = locationNameById?.get(transfer.fromLocationId) ?? transfer.fromLocationId;
  const toLocationName = locationNameById?.get(transfer.toLocationId) ?? transfer.toLocationId;

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Product:</span> {productName}
            </p>
            <p>
              <span className="font-medium">From:</span> {fromLocationName}
            </p>
            <p>
              <span className="font-medium">To:</span> {toLocationName}
            </p>
            <p>
              <span className="font-medium">Quantity:</span> {transfer.quantity}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={String(field.value ?? 0)} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger id="status" aria-invalid={!!errors.status}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STOCK_TRANSFER_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status?.message ? <p className="text-sm text-destructive">{errors.status.message}</p> : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Saving...' : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/inventory/stock-transfers')}>
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
