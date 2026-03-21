import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card as CardUI, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import {
  createCardSchema,
  editCardSchema,
  type CreateCardFormValues,
  type EditCardFormValues,
} from '../schemas/card-form.schema';
import type { Card } from '../types/card.types';

interface CardFormBaseProps {
  initialData?: Partial<Card>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

interface CreateCardFormProps extends CardFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateCardFormValues) => Promise<void>;
}

interface EditCardFormProps extends CardFormBaseProps {
  mode: 'edit';
  onSubmit: (data: EditCardFormValues) => Promise<void>;
}

type CardFormProps = CreateCardFormProps | EditCardFormProps;
type CardFormValues = { name: string };

export function CardForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: CardFormProps) {
  const navigate = useNavigate();
  const schema = mode === 'create' ? createCardSchema : editCardSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (initialData) {
      reset({ name: initialData.name ?? '' });
      return;
    }
    reset({ name: '' });
  }, [initialData, reset]);

  const submit = async (values: CardFormValues) => {
    await onSubmit(values);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <CardUI>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Card name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/settings/cards')}>
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </CardUI>
    </div>
  );
}
