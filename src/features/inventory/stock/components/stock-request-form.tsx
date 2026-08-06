import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { BranchType, StockRequestType } from '@/db/schemas/enums';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import {
  createStockRequestSchema,
  type CreateStockRequestFormValues,
} from '../schemas/stock-forms.schema';
import {
  getRequestedToLocations,
  getRequesterLocations,
  toLocationOption,
} from './stock-request-form/stock-request-form-helpers';
import { StockRequestLinesTable } from './stock-request-form/stock-request-lines-table';

interface StockRequestFormProps {
  onSubmit: (data: CreateStockRequestFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function StockRequestForm({ onSubmit, isSubmitting }: StockRequestFormProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? null;
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;

  const { data: products = [], isLoading: isLoadingProducts } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStockRequestFormValues>({
    resolver: zodResolver(createStockRequestSchema),
    defaultValues: {
      requesterLocationId: '',
      requestedToLocationId: '',
      requestType: StockRequestType.INTER_BRANCH,
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
  const requestType = watch('requestType') as StockRequestType;
  const requesterLocationId = watch('requesterLocationId');

  const requesterLocationOptions = useMemo(
    () =>
      getRequesterLocations({
        locations,
        requestType,
        isHeadOffice,
        userBranchId,
      }).map(toLocationOption),
    [locations, requestType, isHeadOffice, userBranchId],
  );

  const requestedToLocationOptions = useMemo(
    () =>
      getRequestedToLocations({
        locations,
        requestType,
        requesterLocationId,
        isHeadOffice,
        userBranchId,
      }).map(toLocationOption),
    [locations, requestType, requesterLocationId, isHeadOffice, userBranchId],
  );

  useEffect(() => {
    if (requesterLocationOptions.length === 1 && !requesterLocationId) {
      setValue('requesterLocationId', requesterLocationOptions[0]?.value ?? '');
    }
  }, [requesterLocationId, requesterLocationOptions, setValue]);

  useEffect(() => {
    if (
      requesterLocationId &&
      !requesterLocationOptions.some((option) => option.value === requesterLocationId)
    ) {
      setValue('requesterLocationId', '');
    }
  }, [requesterLocationId, requesterLocationOptions, setValue]);

  const requestedToLocationId = watch('requestedToLocationId') ?? '';
  useEffect(() => {
    if (
      requestedToLocationId &&
      !requestedToLocationOptions.some((option) => option.value === requestedToLocationId)
    ) {
      setValue('requestedToLocationId', '');
    }
  }, [requestedToLocationId, requestedToLocationOptions, setValue]);

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
      requestType: values.requestType,
      notes: values.notes,
      submit: values.submit,
      lines: nextLines,
    });
  };

  return (
    <div className="w-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create stock request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <FieldGroup>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="requestType">Request type</FieldLabel>
                  <Controller
                    control={control}
                    name="requestType"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? StockRequestType.INTER_BRANCH)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger id="requestType">
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={String(StockRequestType.INTER_BRANCH)}>
                            Inter branch
                          </SelectItem>
                          <SelectItem value={String(StockRequestType.INTRA_BRANCH)}>
                            Intra branch
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="requesterLocationId">Requester location</FieldLabel>
                  <Controller
                    control={control}
                    name="requesterLocationId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={requesterLocationOptions}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder={
                          isLoadingLocations ? 'Loading locations...' : 'Select location'
                        }
                        disabled={isLoadingLocations}
                        isLoading={isLoadingLocations}
                      />
                    )}
                  />
                  {errors.requesterLocationId?.message ? (
                    <p className="text-sm text-destructive">{errors.requesterLocationId.message}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="requestedToLocationId">Requested to location</FieldLabel>
                  <Controller
                    control={control}
                    name="requestedToLocationId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={requestedToLocationOptions}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        placeholder={isLoadingLocations ? 'Loading locations...' : 'Select source'}
                        disabled={isLoadingLocations}
                        isLoading={isLoadingLocations}
                      />
                    )}
                  />
                </Field>
              </div>

              <StockRequestLinesTable
                control={control}
                errors={errors}
                fields={fields}
                lineValues={lineValues}
                products={products}
                productById={productById}
                isLoadingProducts={isLoadingProducts}
                append={append}
                remove={remove}
              />

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
