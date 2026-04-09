import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  resolveStockMaintenanceSchema,
  type ResolveStockMaintenanceFormValues,
} from '../schemas/stock-forms.schema';

interface StockMaintenanceResolveFormProps {
  onSubmit: (values: ResolveStockMaintenanceFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function StockMaintenanceResolveForm({
  onSubmit,
  isSubmitting,
}: StockMaintenanceResolveFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResolveStockMaintenanceFormValues>({
    resolver: zodResolver(resolveStockMaintenanceSchema),
    defaultValues: {
      quantityReturned: '',
      quantityDisposed: '',
      notes: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Record</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="quantityReturned">Quantity returned</FieldLabel>
              <Input id="quantityReturned" {...register('quantityReturned')} />
              {errors.quantityReturned?.message ? (
                <p className="text-sm text-destructive">{errors.quantityReturned.message}</p>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="quantityDisposed">Quantity disposed</FieldLabel>
              <Input id="quantityDisposed" {...register('quantityDisposed')} />
              {errors.quantityDisposed?.message ? (
                <p className="text-sm text-destructive">{errors.quantityDisposed.message}</p>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" {...register('notes')} />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? 'Saving...' : 'Resolve'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
