import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import { statusFormSchema, type StatusFormValues } from '../schemas/status-form.schema';
import type { Status } from '../types/status.types';

interface StatusFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Status>;
  onSubmit: (data: StatusFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function StatusForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: StatusFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
      color: '#000000',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        color: initialData.color ?? '#000000',
      });
      return;
    }

    reset({
      name: '',
      color: '#000000',
    });
  }, [initialData, mode, reset]);

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
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" placeholder="Status name" aria-invalid={!!errors.name} {...register('name')} />
                {errors.name?.message ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="color">Color</FieldLabel>
                <Input
                  id="color"
                  type="color"
                  aria-invalid={!!errors.color}
                  className="h-10 w-24 p-1"
                  {...register('color')}
                />
                {errors.color?.message ? <p className="text-sm text-destructive">{errors.color.message}</p> : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/statuses')}>
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
