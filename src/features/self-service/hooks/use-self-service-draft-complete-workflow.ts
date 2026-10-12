import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { sanitizeString } from '@/lib/utils';
import type { ParcelBookingFormValues } from '@/features/operations/parcel/components/parcel-create';
import {
  useCompleteSelfServiceDraftMutation,
  useGetSelfServiceDraftQuery,
} from '../api/self-service-agent.api';
import { useSelfServiceDraftCompleteForm } from './use-self-service-draft-complete-form';

export function useSelfServiceDraftCompleteWorkflow() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: draft, isLoading, isError } = useGetSelfServiceDraftQuery(id, { skip: !id });
  const [completeDraft, { isLoading: isSubmitting }] = useCompleteSelfServiceDraftMutation();
  const formState = useSelfServiceDraftCompleteForm(draft);

  const onSubmit = async (values: ParcelBookingFormValues) => {
    const parcel = values.parcels[0];
    if (!draft || !parcel) return;
    try {
      const response = await completeDraft({
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
      }).unwrap();
      toast.success(`Booking created: ${response.parcels[0]?.trackingCode ?? response.bookingId}`);
      navigate('/parcels/self-service');
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to complete this booking');
    }
  };
  const onLocationNameChange = (locationId: string) => {
    const name =
      formState.locationOptions.find((location) => location.id === locationId)?.name ?? '';
    formState.setValue('parcels.0.destinationLocationName', name, { shouldDirty: true });
  };
  return { ...formState, draft, isLoading, isError, isSubmitting, onSubmit, onLocationNameChange };
}
