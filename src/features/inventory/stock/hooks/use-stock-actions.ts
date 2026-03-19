import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCreateStockAdjustmentMutation,
  useCreateStockMovementMutation,
  useCreateStockTransferMutation,
  useUpdateStockTransferMutation,
} from '@/features/inventory/api';
import type {
  CreateStockAdjustmentFormValues,
  CreateStockMovementFormValues,
  CreateStockTransferFormValues,
  UpdateStockTransferFormValues,
} from '../schemas/stock-forms.schema';
import { getInventoryStockErrorMessage } from '../utils/inventory-stock-error';

export function useCreateStockMovementAction() {
  const navigate = useNavigate();
  const [createStockMovement, { isLoading: isSubmitting }] = useCreateStockMovementMutation();

  const onSubmit = async (values: CreateStockMovementFormValues) => {
    try {
      await createStockMovement(values).unwrap();
      toast.success('Stock movement created successfully');
      navigate('/inventory/stock-movements', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useCreateStockAdjustmentAction() {
  const navigate = useNavigate();
  const [createStockAdjustment, { isLoading: isSubmitting }] = useCreateStockAdjustmentMutation();

  const onSubmit = async (values: CreateStockAdjustmentFormValues) => {
    try {
      await createStockAdjustment(values).unwrap();
      toast.success('Stock adjustment created successfully');
      navigate('/inventory/stock-adjustments', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useCreateStockTransferAction() {
  const navigate = useNavigate();
  const [createStockTransfer, { isLoading: isSubmitting }] = useCreateStockTransferMutation();

  const onSubmit = async (values: CreateStockTransferFormValues) => {
    try {
      await createStockTransfer(values).unwrap();
      toast.success('Stock transfer created successfully');
      navigate('/inventory/stock-transfers', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateStockTransferAction(id: string) {
  const navigate = useNavigate();
  const [updateStockTransfer, { isLoading: isSubmitting }] = useUpdateStockTransferMutation();

  const onSubmit = async (values: UpdateStockTransferFormValues) => {
    try {
      await updateStockTransfer({ id, body: values }).unwrap();
      toast.success('Stock transfer updated successfully');
      navigate('/inventory/stock-transfers', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
