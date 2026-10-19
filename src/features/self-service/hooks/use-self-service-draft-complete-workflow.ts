import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { sanitizeString } from '@/lib/utils';
import type { ParcelBookingFormValues } from '@/features/operations/parcel/components/parcel-create';
import type { ReceiptPrintData } from '@/features/operations/parcel/components/parcel-sticker-actions';
import {
  type CompleteSelfServiceDraftInput,
  useCompleteSelfServiceDraftMutation,
  useGetSelfServiceDraftQuery,
} from '../api/self-service-agent.api';
import { useSelfServiceDraftCompleteForm } from './use-self-service-draft-complete-form';
import { buildSelfServiceCompletionReceipt } from '../utils';

export function useSelfServiceDraftCompleteWorkflow() {
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptPrintData | null>(null);
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: draft, isLoading, isError } = useGetSelfServiceDraftQuery(id, { skip: !id });
  const [completeDraft, { isLoading: isSubmitting }] = useCompleteSelfServiceDraftMutation();
  const formState = useSelfServiceDraftCompleteForm(draft);

  const onSubmit = async (values: ParcelBookingFormValues) => {
    const parcel = values.parcels[0];
    if (!draft || !parcel) return;
    try {
      const input: CompleteSelfServiceDraftInput = {
        id: draft.id,
        destinationId: parcel.destinationBranchId,
        pickupLocationId: parcel.destinationLocationId || null,
        parcelDetails: parcel.parcelDetails,
        chargeCedis: sanitizeString(parcel.charge).replace(/,/g, ''),
        chargeAgentUserId: parcel.chargeAgentUserId,
        paymentResponsibility: parcel.paymentResponsibility,
        senderSettlementMode: parcel.senderSettlementMode,
        senderPartialPaymentCedis:
          parcel.paymentResponsibility === 'SPLIT'
            ? sanitizeString(parcel.senderPartialPayment).replace(/,/g, '')
            : null,
        callSender: parcel.callSender,
      };
      const response = await completeDraft(input).unwrap();
      setReceipt(
        buildSelfServiceCompletionReceipt({
          draft,
          input,
          response,
          destinationBranchName:
            formState.destinationBranchOptions.find((branch) => branch.id === input.destinationId)
              ?.name ?? '-',
          destinationLocationName:
            formState.locationOptions.find((location) => location.id === input.pickupLocationId)
              ?.name ?? '-',
        }),
      );
      toast.success(`Booking created: ${response.parcels[0]?.trackingCode ?? response.bookingId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to complete this booking');
    }
  };
  const onLocationNameChange = (locationId: string) => {
    const name =
      formState.locationOptions.find((location) => location.id === locationId)?.name ?? '';
    formState.setValue('parcels.0.destinationLocationName', name, { shouldDirty: true });
  };
  return {
    ...formState,
    receipt,
    onDone: () => navigate('/parcels/self-service'),
    draft,
    isLoading,
    isError,
    isSubmitting,
    onSubmit,
    onLocationNameChange,
    isCustomerEditorOpen,
    openCustomerEditor: () => setIsCustomerEditorOpen(true),
    closeCustomerEditor: () => setIsCustomerEditorOpen(false),
  };
}
