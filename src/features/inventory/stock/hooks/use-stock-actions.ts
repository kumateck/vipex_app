import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAutoFulfillStockRequestLineMutation,
  useAcknowledgeStockRequestLineMutation,
  useAcknowledgeStockTransferReceiptMutation,
  useApproveStockRequestMutation,
  useCreateStockMaintenanceRecordMutation,
  useCreateStockRequestMutation,
  useCreateStockAdjustmentMutation,
  useCreateStockMovementMutation,
  useCreateStockTransferMutation,
  useFulfillStockRequestLineMutation,
  useResolveStockMaintenanceRecordMutation,
  useRejectStockRequestMutation,
  useSubmitStockRequestMutation,
  useUpdateStockTransferMutation,
} from '@/features/inventory/api';
import type {
  CreateStockMaintenanceFormValues,
  CreateStockRequestFormValues,
  FulfillStockRequestLineFormValues,
  RejectStockRequestFormValues,
  ResolveStockMaintenanceFormValues,
  CreateStockAdjustmentFormValues,
  CreateStockMovementFormValues,
  CreateStockTransferFormValues,
  UpdateStockTransferFormValues,
  StockRequestLineAcknowledgeFormValues,
  AcknowledgeStockTransferReceiptFormValues,
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

export function useAcknowledgeStockTransferReceiptAction(transferId: string) {
  const navigate = useNavigate();
  const [acknowledgeTransferReceipt, { isLoading: isSubmitting }] =
    useAcknowledgeStockTransferReceiptMutation();

  const onSubmit = async (values: AcknowledgeStockTransferReceiptFormValues) => {
    try {
      await acknowledgeTransferReceipt({
        transferId,
        body: {
          acceptedQuantity: values.acceptedQuantity,
          damagedQuantity: values.damagedQuantity || undefined,
          missingQuantity: values.missingQuantity || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap();
      toast.success('Transfer receipt acknowledged successfully');
      navigate(`/inventory/stock-transfers/edit/${transferId}`, { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useCreateStockRequestAction() {
  const navigate = useNavigate();
  const [createStockRequest, { isLoading: isSubmitting }] = useCreateStockRequestMutation();

  const onSubmit = async (values: CreateStockRequestFormValues) => {
    try {
      await createStockRequest(values).unwrap();
      toast.success('Stock request created successfully');
      navigate('/inventory/stock-requests', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useSubmitStockRequestAction(id: string) {
  const [submitStockRequest, { isLoading: isSubmitting }] = useSubmitStockRequestMutation();

  const onSubmit = async () => {
    try {
      await submitStockRequest(id).unwrap();
      toast.success('Stock request submitted successfully');
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useApproveStockRequestAction(id: string) {
  const [approveStockRequest, { isLoading: isSubmitting }] = useApproveStockRequestMutation();

  const onSubmit = async () => {
    try {
      await approveStockRequest(id).unwrap();
      toast.success('Stock request approved successfully');
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useRejectStockRequestAction(id: string) {
  const [rejectStockRequest, { isLoading: isSubmitting }] = useRejectStockRequestMutation();

  const onSubmit = async (values: RejectStockRequestFormValues) => {
    try {
      await rejectStockRequest({ id, body: values }).unwrap();
      toast.success('Stock request rejected successfully');
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useFulfillStockRequestLineAction(requestId: string) {
  const navigate = useNavigate();
  const [fulfillLine, { isLoading: isSubmitting }] = useFulfillStockRequestLineMutation();

  const onSubmit = async (values: FulfillStockRequestLineFormValues) => {
    try {
      await fulfillLine({
        requestId,
        body: {
          lineId: values.lineId,
          fromLocationId: values.fromLocationId,
          fulfillQuantity: values.fulfillQuantity,
          notes: values.notes,
        },
      }).unwrap();
      toast.success('Stock request line fulfilled successfully');
      navigate(`/inventory/stock-requests/view/${requestId}`, { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useAutoFulfillStockRequestLineAction(requestId: string) {
  const [autoFulfill, { isLoading: isSubmitting }] = useAutoFulfillStockRequestLineMutation();

  const onSubmit = async (lineId: string, notes?: string) => {
    try {
      const result = await autoFulfill({ requestId, lineId, notes }).unwrap();
      if (result.fulfilledQuantity > 0) {
        toast.success(`Auto-fulfilled ${result.fulfilledQuantity} base units`);
      } else {
        toast.info('No quantity could be auto-fulfilled');
      }
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useAcknowledgeStockRequestLineAction(requestId: string) {
  const navigate = useNavigate();
  const [acknowledgeLine, { isLoading: isSubmitting }] = useAcknowledgeStockRequestLineMutation();

  const onSubmit = async (values: StockRequestLineAcknowledgeFormValues) => {
    try {
      await acknowledgeLine({
        requestId,
        body: {
          lineId: values.lineId,
          acknowledgedQuantity: values.acknowledgedQuantity,
          notes: values.notes,
        },
      }).unwrap();
      toast.success('Request line acknowledged successfully');
      navigate(`/inventory/stock-requests/view/${requestId}`, { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useCreateStockMaintenanceAction() {
  const navigate = useNavigate();
  const [createRecord, { isLoading: isSubmitting }] = useCreateStockMaintenanceRecordMutation();

  const onSubmit = async (values: CreateStockMaintenanceFormValues) => {
    try {
      await createRecord(values).unwrap();
      toast.success('Stock maintenance record created successfully');
      navigate('/inventory/stock-maintenance', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useResolveStockMaintenanceAction(id: string) {
  const navigate = useNavigate();
  const [resolveRecord, { isLoading: isSubmitting }] = useResolveStockMaintenanceRecordMutation();

  const onSubmit = async (values: ResolveStockMaintenanceFormValues) => {
    try {
      await resolveRecord({ id, body: values }).unwrap();
      toast.success('Stock maintenance record resolved successfully');
      navigate('/inventory/stock-maintenance', { replace: true });
    } catch (error) {
      toast.error(getInventoryStockErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
