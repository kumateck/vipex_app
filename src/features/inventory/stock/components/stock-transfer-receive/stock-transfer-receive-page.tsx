import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useGetStockTransferQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { useAuthStore } from '@/stores/auth-store';
import { StockLoadError } from '../stock-load-error';
import { useAcknowledgeStockTransferReceiptAction } from '../../hooks/use-stock-actions';
import {
  acknowledgeStockTransferReceiptSchema,
  type AcknowledgeStockTransferReceiptFormValues,
} from '../../schemas/stock-forms.schema';

export function StockTransferReceivePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: transfer, isLoading, error } = useGetStockTransferQuery(id, { skip: !id });
  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { onSubmit, isSubmitting } = useAcknowledgeStockTransferReceiptAction(id);

  const product = productsData.find((row) => row.id === transfer?.productId);
  const locationNameById = new Map(
    locations.map((location) => [location.id, location.name] as const),
  );
  const conversionRows = (product?.unitConversions ?? []).map((item) => ({
    unitOfMeasure: item.unitOfMeasure,
    factorToBase: Number.parseInt(item.factorToBase, 10),
  }));

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcknowledgeStockTransferReceiptFormValues>({
    resolver: zodResolver(acknowledgeStockTransferReceiptSchema),
    defaultValues: {
      acceptedQuantity: '',
      damagedQuantity: '',
      missingQuantity: '',
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

  if (error || !transfer) {
    return (
      <ScrollableWrapper>
        <StockLoadError
          message="Failed to load stock transfer receiving details"
          onBack={() => navigate('/inventory/stock-transfers')}
        />
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receive stock transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Product:</span> {product?.name ?? transfer.productId}
              </p>
              <p>
                <span className="font-medium">From:</span>{' '}
                {locationNameById.get(transfer.fromLocationId) ?? transfer.fromLocationId}
              </p>
              <p>
                <span className="font-medium">To:</span>{' '}
                {locationNameById.get(transfer.toLocationId) ?? transfer.toLocationId}
              </p>
              <p>
                <span className="font-medium">Requested:</span>{' '}
                {formatBaseQuantityWithBestUnits(transfer.quantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Fulfilled:</span>{' '}
                {formatBaseQuantityWithBestUnits(transfer.fulfilledQuantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending receipt acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(
                  transfer.acceptance?.pendingToAcknowledge ?? transfer.fulfilledQuantity,
                  conversionRows,
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receiving acknowledgement</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="acceptedQuantity">Accepted quantity (base)</FieldLabel>
                    <Input
                      id="acceptedQuantity"
                      placeholder="e.g. 40"
                      aria-invalid={!!errors.acceptedQuantity}
                      {...register('acceptedQuantity')}
                    />
                    {errors.acceptedQuantity?.message ? (
                      <p className="text-sm text-destructive">{errors.acceptedQuantity.message}</p>
                    ) : null}
                  </Field>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="damagedQuantity">Damaged quantity (optional)</FieldLabel>
                      <Input
                        id="damagedQuantity"
                        placeholder="0"
                        aria-invalid={!!errors.damagedQuantity}
                        {...register('damagedQuantity')}
                      />
                      {errors.damagedQuantity?.message ? (
                        <p className="text-sm text-destructive">{errors.damagedQuantity.message}</p>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="missingQuantity">Missing quantity (optional)</FieldLabel>
                      <Input
                        id="missingQuantity"
                        placeholder="0"
                        aria-invalid={!!errors.missingQuantity}
                        {...register('missingQuantity')}
                      />
                      {errors.missingQuantity?.message ? (
                        <p className="text-sm text-destructive">{errors.missingQuantity.message}</p>
                      ) : null}
                    </Field>
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
        </div>
      </div>
    </ScrollableWrapper>
  );
}
