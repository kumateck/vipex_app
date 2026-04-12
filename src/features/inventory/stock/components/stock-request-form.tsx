import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
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
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import {
  createStockRequestSchema,
  type CreateStockRequestFormValues,
} from '../schemas/stock-forms.schema';

interface StockRequestFormProps {
  onSubmit: (data: CreateStockRequestFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function StockRequestForm({ onSubmit, isSubmitting }: StockRequestFormProps) {
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const { data: productsData, isLoading: isLoadingProducts } = useListInventoryProductsQuery(
    {
      page: 1,
      pageSize: 500,
      filters: { companyId },
    },
    { skip: !companyId },
  );
  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });

  const products = productsData?.data ?? [];
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateStockRequestFormValues>({
    resolver: zodResolver(createStockRequestSchema),
    defaultValues: {
      requesterLocationId: '',
      requestedToLocationId: '',
      notes: '',
      submit: true,
      lines: [
        {
          productId: '',
          quantityUnitOfMeasure: 0,
          requestedQuantity: '',
          notes: '',
        },
      ],
    },
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const lineValues = watch('lines');

  const submit = async (values: CreateStockRequestFormValues) => {
    const nextLines = values.lines.map((line) => {
      const product = productById.get(line.productId);
      const conversions = product?.unitConversions ?? [
        { unitOfMeasure: product?.unitOfMeasure ?? 0, factorToBase: '1' },
      ];
      const conversionRows = conversions.map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number.parseInt(item.factorToBase, 10),
      }));
      const sourceUnit = line.quantityUnitOfMeasure ?? product?.unitOfMeasure ?? 0;
      const requestedBase = convertToBaseUnits(
        Number.parseFloat(line.requestedQuantity),
        sourceUnit,
        conversionRows,
      );
      return {
        productId: line.productId,
        requestedQuantity: String(requestedBase),
        notes: line.notes,
      };
    });

    await onSubmit({
      requesterLocationId: values.requesterLocationId,
      requestedToLocationId: values.requestedToLocationId,
      notes: values.notes,
      submit: values.submit,
      lines: nextLines,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create stock request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="requesterLocationId">Requester location</FieldLabel>
                <Controller
                  control={control}
                  name="requesterLocationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="requesterLocationId"
                        aria-invalid={!!errors.requesterLocationId}
                        disabled={isLoadingLocations}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLocations
                              ? 'Loading locations...'
                              : 'Select requester location'
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
                {errors.requesterLocationId?.message ? (
                  <p className="text-sm text-destructive">{errors.requesterLocationId.message}</p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="requestedToLocationId">
                  Requested to location (optional)
                </FieldLabel>
                <Controller
                  control={control}
                  name="requestedToLocationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="requestedToLocationId"
                        aria-invalid={!!errors.requestedToLocationId}
                        disabled={isLoadingLocations}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLocations ? 'Loading locations...' : 'Select target location'
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
              </Field>

              {fields.map((field, index) => {
                const selectedProductId = lineValues?.[index]?.productId ?? '';
                const selectedProduct = productById.get(selectedProductId);
                const unitOptions = (
                  selectedProduct?.unitConversions ?? [
                    {
                      unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0,
                      factorToBase: '1',
                    },
                  ]
                )
                  .map((item) =>
                    UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure),
                  )
                  .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] =>
                    Boolean(item),
                  );

                return (
                  <div key={field.id} className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Line {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <Field>
                      <FieldLabel htmlFor={`lines.${index}.productId`}>Product</FieldLabel>
                      <Controller
                        control={control}
                        name={`lines.${index}.productId`}
                        render={({ field: lineField }) => (
                          <Select value={lineField.value ?? ''} onValueChange={lineField.onChange}>
                            <SelectTrigger
                              id={`lines.${index}.productId`}
                              aria-invalid={!!errors.lines?.[index]?.productId}
                              disabled={isLoadingProducts}
                            >
                              <SelectValue
                                placeholder={
                                  isLoadingProducts ? 'Loading products...' : 'Select product'
                                }
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
                      {errors.lines?.[index]?.productId?.message ? (
                        <p className="text-sm text-destructive">
                          {errors.lines[index]?.productId?.message}
                        </p>
                      ) : null}
                    </Field>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor={`lines.${index}.requestedQuantity`}>
                          Requested quantity
                        </FieldLabel>
                        <Input
                          id={`lines.${index}.requestedQuantity`}
                          placeholder="e.g. 5"
                          aria-invalid={!!errors.lines?.[index]?.requestedQuantity}
                          {...register(`lines.${index}.requestedQuantity`)}
                        />
                        {errors.lines?.[index]?.requestedQuantity?.message ? (
                          <p className="text-sm text-destructive">
                            {errors.lines[index]?.requestedQuantity?.message}
                          </p>
                        ) : null}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor={`lines.${index}.quantityUnitOfMeasure`}>
                          Unit
                        </FieldLabel>
                        <Controller
                          control={control}
                          name={`lines.${index}.quantityUnitOfMeasure`}
                          render={({ field: lineField }) => (
                            <Select
                              value={String(lineField.value ?? selectedProduct?.unitOfMeasure ?? 0)}
                              onValueChange={(value) => lineField.onChange(Number(value))}
                            >
                              <SelectTrigger id={`lines.${index}.quantityUnitOfMeasure`}>
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

                    <Field>
                      <FieldLabel htmlFor={`lines.${index}.notes`}>
                        Line notes (optional)
                      </FieldLabel>
                      <Textarea
                        id={`lines.${index}.notes`}
                        placeholder="Optional"
                        aria-invalid={!!errors.lines?.[index]?.notes}
                        {...register(`lines.${index}.notes`)}
                      />
                    </Field>
                  </div>
                );
              })}

              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      productId: '',
                      quantityUnitOfMeasure: 0,
                      requestedQuantity: '',
                      notes: '',
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </Button>
              </div>

              <Field>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea id="notes" placeholder="Optional request notes" {...register('notes')} />
              </Field>

              <Field>
                <FieldLabel htmlFor="submit">Request mode</FieldLabel>
                <Controller
                  control={control}
                  name="submit"
                  render={({ field }) => (
                    <Select
                      value={field.value === false ? 'draft' : 'submit'}
                      onValueChange={(value) => field.onChange(value === 'submit')}
                    >
                      <SelectTrigger id="submit">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submit">Submit now</SelectItem>
                        <SelectItem value="draft">Save as draft</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Saving...' : 'Create stock request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-requests')}
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
