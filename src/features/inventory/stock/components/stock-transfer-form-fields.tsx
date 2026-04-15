import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { CreateStockTransferFormValues } from '../schemas/stock-forms.schema';

interface ProductOption {
  id: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

interface UnitOption {
  value: number;
  label: string;
}

interface StockTransferFormFieldsProps {
  control: Control<CreateStockTransferFormValues>;
  register: UseFormRegister<CreateStockTransferFormValues>;
  errors: FieldErrors<CreateStockTransferFormValues>;
  products: ProductOption[];
  locations: LocationOption[];
  selectedFromLocationId: string;
  selectedProductId: string;
  selectedProductUnitOfMeasure: number;
  selectedProductConversions: { unitOfMeasure: number; factorToBase: number }[];
  unitOptions: UnitOption[];
  isLoadingProducts: boolean;
  isLoadingLocations: boolean;
  sourceOnHandBase: number;
  committedTransferBase: number;
  availableToTransferBase: number;
  exceedsAvailableTransfer: boolean;
  isSubmitting: boolean;
  submitButtonText: string;
  onCancel: () => void;
}

export function StockTransferFormFields({
  control,
  register,
  errors,
  products,
  locations,
  selectedFromLocationId,
  selectedProductId,
  selectedProductUnitOfMeasure,
  selectedProductConversions,
  unitOptions,
  isLoadingProducts,
  isLoadingLocations,
  sourceOnHandBase,
  committedTransferBase,
  availableToTransferBase,
  exceedsAvailableTransfer,
  isSubmitting,
  submitButtonText,
  onCancel,
}: StockTransferFormFieldsProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="productId">Product</FieldLabel>
        <Controller
          control={control}
          name="productId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="productId"
                aria-invalid={!!errors.productId}
                disabled={isLoadingProducts}
              >
                <SelectValue
                  placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'}
                />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.productId?.message ? (
          <p className="text-sm text-destructive">{errors.productId.message}</p>
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="fromLocationId">From location</FieldLabel>
        <Controller
          control={control}
          name="fromLocationId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="fromLocationId"
                aria-invalid={!!errors.fromLocationId}
                disabled={isLoadingLocations}
              >
                <SelectValue
                  placeholder={
                    isLoadingLocations ? 'Loading locations...' : 'Select source location'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.fromLocationId?.message ? (
          <p className="text-sm text-destructive">{errors.fromLocationId.message}</p>
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="toLocationId">To location</FieldLabel>
        <Controller
          control={control}
          name="toLocationId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="toLocationId"
                aria-invalid={!!errors.toLocationId}
                disabled={isLoadingLocations}
              >
                <SelectValue
                  placeholder={
                    isLoadingLocations ? 'Loading locations...' : 'Select destination location'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((location) => location.id !== selectedFromLocationId)
                  .map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.toLocationId?.message ? (
          <p className="text-sm text-destructive">{errors.toLocationId.message}</p>
        ) : null}
        {selectedFromLocationId ? (
          <p className="text-xs text-muted-foreground">
            Destination must be different from source location.
          </p>
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
        <Input
          id="quantity"
          placeholder="e.g. 10"
          aria-invalid={!!errors.quantity}
          {...register('quantity')}
        />
        {errors.quantity?.message ? (
          <p className="text-sm text-destructive">{errors.quantity.message}</p>
        ) : null}
        {selectedProductId && selectedFromLocationId ? (
          <p className="text-xs text-muted-foreground">
            On hand: {formatBaseQuantityWithBestUnits(sourceOnHandBase, selectedProductConversions)}{' '}
            | Committed:{' '}
            {formatBaseQuantityWithBestUnits(committedTransferBase, selectedProductConversions)} |
            Available:{' '}
            {formatBaseQuantityWithBestUnits(availableToTransferBase, selectedProductConversions)}
          </p>
        ) : null}
        {selectedProductId && selectedFromLocationId ? (
          <p className="text-xs text-muted-foreground">
            Max transferable now:{' '}
            {formatBaseQuantityWithBestUnits(availableToTransferBase, selectedProductConversions)}
          </p>
        ) : null}
        {exceedsAvailableTransfer ? (
          <p className="text-sm text-destructive">
            Requested quantity exceeds available source stock.
          </p>
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="quantityUnitOfMeasure">Quantity Unit</FieldLabel>
        <Controller
          control={control}
          name="quantityUnitOfMeasure"
          render={({ field }) => (
            <Select
              value={String(field.value ?? selectedProductUnitOfMeasure)}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger
                id="quantityUnitOfMeasure"
                aria-invalid={!!errors.quantityUnitOfMeasure}
              >
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

      <Field>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea
          id="notes"
          placeholder="Optional"
          aria-invalid={!!errors.notes}
          {...register('notes')}
        />
        {errors.notes?.message ? (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        ) : null}
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || exceedsAvailableTransfer}>
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Creating...' : submitButtonText}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </FieldGroup>
  );
}
