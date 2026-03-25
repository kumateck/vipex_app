import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import {
  createCardSchema,
  editCardSchema,
  type CreateCardFormValues,
  type EditCardFormValues,
} from '../schemas/card-form.schema';
import { useCreateCardAction, useUpdateCardAction } from '../hooks/use-card-actions';
import type { Card } from '../types/card.types';

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Card | null;
}

export function CardModal({ open, onOpenChange, card }: CardModalProps) {
  const isEditing = !!card;
  const { onSubmit: createSubmit, isSubmitting: isCreating } = useCreateCardAction();
  const { onSubmit: updateSubmit, isSubmitting: isUpdating } = useUpdateCardAction(card?.id ?? '');

  const schema = isEditing ? editCardSchema : createCardSchema;
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCardFormValues | EditCardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      reset({ name: card?.name ?? '' });
    }
  }, [open, card, reset]);

  const onSubmit = async (values: CreateCardFormValues | EditCardFormValues) => {
    let success = false;
    if (isEditing) {
      success = await updateSubmit(values as EditCardFormValues);
    } else {
      success = await createSubmit(values as CreateCardFormValues);
    }
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit card' : 'Create card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Card name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name?.message ? (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting
                ? `${isEditing ? 'Saving...' : 'Creating...'}`
                : isEditing
                  ? 'Save'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
