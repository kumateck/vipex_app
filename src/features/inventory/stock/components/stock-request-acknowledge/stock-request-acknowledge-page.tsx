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
import { useGetStockRequestQuery } from '@/features/inventory/api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { useAuthStore } from '@/stores/auth-store';
import { StockLoadError } from '../stock-load-error';
import { useAcknowledgeStockRequestLineAction } from '../../hooks/use-stock-actions';
import {
  acknowledgeStockRequestLineSchema,
  type StockRequestLineAcknowledgeFormValues,
} from '../../schemas/stock-forms.schema';

export function StockRequestAcknowledgePage() {
  const navigate = useNavigate();
  const { requestId = '', lineId = '' } = useParams<{ requestId: string; lineId: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const {
    data: request,
    isLoading,
    error,
  } = useGetStockRequestQuery(requestId, { skip: !requestId });
  const { data: productsData } = useListInventoryProductsQuery(
    {
      page: 1,
      pageSize: 500,
      filters: { companyId },
    },
    { skip: !companyId },
  );
  const { onSubmit, isSubmitting } = useAcknowledgeStockRequestLineAction(requestId);

  const line = request?.lines?.find((row) => row.id === lineId);
  const product = (productsData?.data ?? []).find((row) => row.id === line?.productId);
  const remainingAck = Math.max(0, Number(line?.pendingAcknowledgementQuantity ?? 0));
  const conversionRows = (product?.unitConversions ?? []).map((item) => ({
    unitOfMeasure: item.unitOfMeasure,
    factorToBase: Number.parseInt(item.factorToBase, 10),
  }));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockRequestLineAcknowledgeFormValues>({
    resolver: zodResolver(acknowledgeStockRequestLineSchema),
    defaultValues: { lineId, acknowledgedQuantity: '', notes: '' },
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
          message="Failed to load stock request acknowledgement details"
          onBack={() => navigate(`/inventory/stock-requests/view/${requestId}`)}
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
              <CardTitle>Acknowledge request line receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Product:</span> {product?.name ?? line.productId}
              </p>
              <p>
                <span className="font-medium">Fulfilled:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.fulfilledQuantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Already acknowledged:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.acknowledgedQuantity ?? '0', conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(remainingAck), conversionRows)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt acknowledgement</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={handleSubmit(async (values) => {
                  await onSubmit(values);
                })}
              >
                <FieldGroup>
                  <input type="hidden" {...register('lineId')} />
                  <Field>
                    <FieldLabel htmlFor="acknowledgedQuantity">
                      Acknowledged quantity (base)
                    </FieldLabel>
                    <Input
                      id="acknowledgedQuantity"
                      placeholder="e.g. 10"
                      aria-invalid={!!errors.acknowledgedQuantity}
                      {...register('acknowledgedQuantity')}
                    />
                    {errors.acknowledgedQuantity?.message ? (
                      <p className="text-sm text-destructive">
                        {errors.acknowledgedQuantity.message}
                      </p>
                    ) : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <Controller
                      control={control}
                      name="notes"
                      render={({ field }) => (
                        <Textarea
                          id="notes"
                          placeholder="Optional receiving remarks"
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
        </div>
      </div>
    </ScrollableWrapper>
  );
}
