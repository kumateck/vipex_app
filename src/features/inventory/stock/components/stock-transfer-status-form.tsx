import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { STOCK_TRANSFER_STATUS_OPTIONS } from '../constants/stock-options';
import {
  updateStockTransferSchema,
  type UpdateStockTransferFormValues,
} from '../schemas/stock-forms.schema';
import type { StockTransfer } from '../types/inventory-stock.types';

interface StockTransferStatusFormProps {
  transfer: StockTransfer;
  onSubmit: (data: UpdateStockTransferFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
  productNameById?: ReadonlyMap<string, string>;
  productConversionsById?: ReadonlyMap<string, { unitOfMeasure: number; factorToBase: string }[]>;
  locationNameById?: ReadonlyMap<string, string>;
}

export function StockTransferStatusForm({
  transfer,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
  productNameById,
  productConversionsById,
  locationNameById,
}: StockTransferStatusFormProps) {
  const navigate = useNavigate();
  const defaultStatus = useMemo(() => transfer.status ?? 0, [transfer.status]);
  const requestedQuantity = useMemo(() => Number(transfer.quantity ?? '0'), [transfer.quantity]);
  const fulfilledQuantity = useMemo(
    () => Number(transfer.fulfilledQuantity ?? '0'),
    [transfer.fulfilledQuantity],
  );
  const remainingQuantity = Math.max(0, requestedQuantity - fulfilledQuantity);
  const acceptedQuantity = Number(transfer.acceptance?.totalAccepted ?? '0');
  const pendingAckQuantity = Number(transfer.acceptance?.pendingToAcknowledge ?? '0');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateStockTransferFormValues>({
    resolver: zodResolver(updateStockTransferSchema),
    defaultValues: { status: defaultStatus, fulfillQuantity: '' },
    mode: 'onSubmit',
  });

  const productName = productNameById?.get(transfer.productId) ?? transfer.productId;
  const fromLocationName =
    locationNameById?.get(transfer.fromLocationId) ?? transfer.fromLocationId;
  const toLocationName = locationNameById?.get(transfer.toLocationId) ?? transfer.toLocationId;
  const productConversions = (productConversionsById?.get(transfer.productId) ?? []).map(
    (conversion) => ({
      unitOfMeasure: conversion.unitOfMeasure,
      factorToBase: Number.parseInt(conversion.factorToBase, 10),
    }),
  );

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
              <span className="font-medium">Quantity:</span>{' '}
              {formatBaseQuantityWithBestUnits(transfer.quantity, productConversions)}
            </p>
            <p>
              <span className="font-medium">Fulfilled:</span>{' '}
              {formatBaseQuantityWithBestUnits(transfer.fulfilledQuantity, productConversions)}
            </p>
            <p>
              <span className="font-medium">Remaining:</span>{' '}
              {formatBaseQuantityWithBestUnits(String(remainingQuantity), productConversions)}
            </p>
            <p>
              <span className="font-medium">Acknowledged Receipt:</span>{' '}
              {formatBaseQuantityWithBestUnits(String(acceptedQuantity), productConversions)}
            </p>
            <p>
              <span className="font-medium">Pending Receipt Ack:</span>{' '}
              {formatBaseQuantityWithBestUnits(String(pendingAckQuantity), productConversions)}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fulfillQuantity">Fulfill Quantity (optional)</FieldLabel>
                <Controller
                  control={control}
                  name="fulfillQuantity"
                  render={({ field }) => (
                    <Input
                      id="fulfillQuantity"
                      inputMode="numeric"
                      min={0}
                      max={remainingQuantity}
                      placeholder="0"
                      aria-invalid={!!errors.fulfillQuantity}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.fulfillQuantity?.message ? (
                  <p className="text-sm text-destructive">{errors.fulfillQuantity.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
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
                {errors.status?.message ? (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                ) : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Saving...' : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-transfers')}
                >
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
