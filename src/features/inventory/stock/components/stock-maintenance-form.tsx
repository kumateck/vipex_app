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
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import {
  createStockMaintenanceSchema,
  type CreateStockMaintenanceFormValues,
} from '../schemas/stock-forms.schema';
import { STOCK_MAINTENANCE_ISSUE_TYPE_OPTIONS } from '../constants/stock-options';

interface StockMaintenanceFormProps {
  onSubmit: (values: CreateStockMaintenanceFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function StockMaintenanceForm({ onSubmit, isSubmitting }: StockMaintenanceFormProps) {
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStockMaintenanceFormValues>({
    resolver: zodResolver(createStockMaintenanceSchema),
    defaultValues: {
      productId: '',
      locationId: '',
      issueType: 0,
      quantity: '',
      notes: '',
    },
  });

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Stock Maintenance Record</CardTitle>
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
                      <SelectTrigger id="productId" aria-invalid={!!errors.productId}>
                        <SelectValue placeholder="Select product" />
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
              </Field>
              <Field>
                <FieldLabel htmlFor="locationId">Location</FieldLabel>
                <Controller
                  control={control}
                  name="locationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="locationId" aria-invalid={!!errors.locationId}>
                        <SelectValue placeholder="Select location" />
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
              </Field>
              <Field>
                <FieldLabel htmlFor="issueType">Issue type</FieldLabel>
                <Controller
                  control={control}
                  name="issueType"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="issueType">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        {STOCK_MAINTENANCE_ISSUE_TYPE_OPTIONS.map((option) => (
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
                <FieldLabel htmlFor="quantity">Quantity (base units)</FieldLabel>
                <Input id="quantity" {...register('quantity')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea id="notes" {...register('notes')} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Saving...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-maintenance')}
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
