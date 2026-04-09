import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetStockRequestLineAllocationQuery,
  useGetStockRequestQuery,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import { StockLoadError } from '../components/stock-load-error';
import { useFulfillStockRequestLineAction } from '../hooks/use-stock-actions';
import {
  fulfillStockRequestLineSchema,
  type FulfillStockRequestLineFormValues,
} from '../schemas/stock-forms.schema';
import { useAuthStore } from '@/stores/auth-store';

export function StockRequestFulfillPage() {
  const navigate = useNavigate();
  const { requestId = '', lineId = '' } = useParams<{ requestId: string; lineId: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const {
    data: request,
    isLoading,
    error,
  } = useGetStockRequestQuery(requestId, { skip: !requestId });
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: productsData } = useListInventoryProductsQuery({
    page: 1,
    pageSize: 500,
    filters: { companyId },
  });
  const { onSubmit, isSubmitting } = useFulfillStockRequestLineAction(requestId);
  const { data: allocation } = useGetStockRequestLineAllocationQuery(
    { requestId, lineId },
    { skip: !requestId || !lineId },
  );

  const products = productsData?.data ?? [];
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );

  const line = request?.lines?.find((row) => row.id === lineId);
  const product = line ? productById.get(line.productId) : undefined;
  const sourceConversions = product?.unitConversions ?? [
    { unitOfMeasure: product?.unitOfMeasure ?? 0, factorToBase: '1' },
  ];
  const conversions = sourceConversions.map((item) => ({
    unitOfMeasure: item.unitOfMeasure,
    factorToBase: Number.parseInt(item.factorToBase, 10),
  }));
  const unitOptions = sourceConversions
    .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
    .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  const remaining = line
    ? Math.max(0, Number(line.requestedQuantity) - Number(line.fulfilledQuantity))
    : 0;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FulfillStockRequestLineFormValues>({
    resolver: zodResolver(fulfillStockRequestLineSchema),
    defaultValues: {
      lineId,
      fromLocationId: '',
      fulfillQuantity: '',
      fulfillQuantityUnitOfMeasure: product?.unitOfMeasure ?? 0,
      notes: '',
    },
    mode: 'onSubmit',
  });

  if (isLoading) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <Spinner />
        </div>
      </ScrollableWrapper>
    );
  }

  if (error || !request || !line) {
    return (
      <ScrollableWrapper>
        <StockLoadError
          message="Failed to load stock request line"
          onBack={() => navigate(`/inventory/stock-requests/view/${requestId}`)}
        />
      </ScrollableWrapper>
    );
  }

  const submit = async (values: FulfillStockRequestLineFormValues) => {
    const sourceUnit = values.fulfillQuantityUnitOfMeasure ?? product?.unitOfMeasure ?? 0;
    const fulfillBase = convertToBaseUnits(
      Number.parseFloat(values.fulfillQuantity),
      sourceUnit,
      conversions,
    );
    await onSubmit({
      lineId: values.lineId,
      fromLocationId: values.fromLocationId,
      fulfillQuantity: String(fulfillBase),
      notes: values.notes,
    });
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fulfill stock request line</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Product:</span> {product?.name ?? line.productId}
              </p>
              <p>
                <span className="font-medium">Requester location:</span>{' '}
                {locationNameById.get(request.requesterLocationId) ?? request.requesterLocationId}
              </p>
              <p>
                <span className="font-medium">Requested:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.requestedQuantity, conversions)}
              </p>
              <p>
                <span className="font-medium">Fulfilled:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.fulfilledQuantity, conversions)}
              </p>
              <p>
                <span className="font-medium">Remaining:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(remaining), conversions)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fulfillment details</CardTitle>
            </CardHeader>
            <CardContent>
              {allocation?.candidates?.length ? (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">
                    Suggested source order (auto-allocation)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Location</th>
                          <th className="text-left py-2 pr-4">Available (base)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocation.candidates.map((candidate) => (
                          <tr key={candidate.locationId} className="border-b">
                            <td className="py-2 pr-4">
                              {locationNameById.get(candidate.locationId) ?? candidate.locationId}
                            </td>
                            <td className="py-2 pr-4">{candidate.availableQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="fromLocationId">Source location</FieldLabel>
                    <Controller
                      control={control}
                      name="fromLocationId"
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger id="fromLocationId" aria-invalid={!!errors.fromLocationId}>
                            <SelectValue placeholder="Select source location" />
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

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fulfillQuantity">Fulfill quantity</FieldLabel>
                      <Input
                        id="fulfillQuantity"
                        placeholder="e.g. 2"
                        aria-invalid={!!errors.fulfillQuantity}
                        {...register('fulfillQuantity')}
                      />
                      {errors.fulfillQuantity?.message ? (
                        <p className="text-sm text-destructive">{errors.fulfillQuantity.message}</p>
                      ) : null}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="fulfillQuantityUnitOfMeasure">Unit</FieldLabel>
                      <Controller
                        control={control}
                        name="fulfillQuantityUnitOfMeasure"
                        render={({ field }) => (
                          <Select
                            value={String(field.value ?? product?.unitOfMeasure ?? 0)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger id="fulfillQuantityUnitOfMeasure">
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
                    <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                    <Textarea id="notes" placeholder="Optional" {...register('notes')} />
                  </Field>

                  <input type="hidden" {...register('lineId')} />

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner /> : null}
                      {isSubmitting ? 'Saving...' : 'Fulfill'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link to={`/inventory/stock-requests/view/${requestId}`}>Cancel</Link>
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
