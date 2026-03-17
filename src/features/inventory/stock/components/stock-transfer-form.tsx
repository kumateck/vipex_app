import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { createStockTransferSchema, type CreateStockTransferFormValues } from '../schemas/stock-forms.schema';

interface StockTransferFormProps {
  onSubmit: (data: CreateStockTransferFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

const OPTIONS_PAGE_SIZE = 100;

export function StockTransferForm({ onSubmit, isSubmitting, title, submitButtonText }: StockTransferFormProps) {
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const productQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );
  const locationQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );

  const { data: productsData, isLoading: isLoadingProducts } = useListInventoryProductsQuery(productQuery, {
    skip: !companyId,
  });
  const { data: locationsData, isLoading: isLoadingLocations } = useListInventoryLocationsQuery(locationQuery, {
    skip: !companyId,
  });

  const products = productsData?.data ?? [];
  const locations = locationsData?.data ?? [];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStockTransferFormValues>({
    resolver: zodResolver(createStockTransferSchema),
    defaultValues: {
      productId: '',
      fromLocationId: '',
      toLocationId: '',
      quantity: '',
      notes: '',
    },
    mode: 'onSubmit',
  });

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="productId">Product</FieldLabel>
                <Controller
                  control={control}
                  name="productId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="productId" aria-invalid={!!errors.productId} disabled={isLoadingProducts}>
                        <SelectValue placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'} />
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
                      <SelectTrigger id="fromLocationId" aria-invalid={!!errors.fromLocationId} disabled={isLoadingLocations}>
                        <SelectValue placeholder={isLoadingLocations ? 'Loading locations...' : 'Select source location'} />
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
                      <SelectTrigger id="toLocationId" aria-invalid={!!errors.toLocationId} disabled={isLoadingLocations}>
                        <SelectValue placeholder={isLoadingLocations ? 'Loading locations...' : 'Select destination location'} />
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
                {errors.toLocationId?.message ? (
                  <p className="text-sm text-destructive">{errors.toLocationId.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                <Input id="quantity" placeholder="e.g. 10" aria-invalid={!!errors.quantity} {...register('quantity')} />
                {errors.quantity?.message ? (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea id="notes" placeholder="Optional" aria-invalid={!!errors.notes} {...register('notes')} />
                {errors.notes?.message ? <p className="text-sm text-destructive">{errors.notes.message}</p> : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Creating...' : submitButtonText}
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
