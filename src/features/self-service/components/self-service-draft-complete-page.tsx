import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeString } from '@/lib/utils';
import {
  ParcelCardChargeSection,
  ParcelCardDestinationSection,
  type ParcelBookingFormValues,
} from '@/features/operations/parcel/components/parcel-create';
import {
  useCompleteSelfServiceDraftMutation,
  useGetSelfServiceDraftQuery,
} from '../api/self-service-agent.api';
import { useSelfServiceDraftCompleteForm } from '../hooks/use-self-service-draft-complete-form';
import { SelfServiceDraftSummaryCard } from './self-service-draft-summary-card';

export function SelfServiceDraftCompletePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: draft, isLoading, isError } = useGetSelfServiceDraftQuery(id, { skip: !id });
  const [completeDraft, { isLoading: isSubmitting }] = useCompleteSelfServiceDraftMutation();

  const {
    form,
    control,
    clearErrors,
    setValue,
    destinationBranchId,
    destinationBranchOptions,
    locationOptions,
    isLoadingLocations,
    locationPlaceholder,
    paymentResponsibility,
    parcelChargeValue,
    senderIsCreditEligible,
  } = useSelfServiceDraftCompleteForm(draft);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !draft) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        This booking draft could not be found. It may have expired or already been completed.
      </p>
    );
  }

  const onSubmit = async (values: ParcelBookingFormValues) => {
    const parcel = values.parcels[0];
    if (!parcel) return;
    try {
      const response = await completeDraft({
        id: draft.id,
        destinationId: parcel.destinationBranchId,
        pickupLocationId: parcel.destinationLocationId || null,
        parcelDetails: parcel.parcelDetails,
        chargeCedis: sanitizeString(parcel.charge).replace(/,/g, ''),
        paymentResponsibility: parcel.paymentResponsibility,
        senderSettlementMode: parcel.senderSettlementMode,
        senderPartialPaymentCedis:
          parcel.paymentResponsibility === 'SPLIT'
            ? sanitizeString(parcel.senderPartialPayment).replace(/,/g, '')
            : null,
      }).unwrap();
      toast.success(`Booking created: ${response.parcels[0]?.trackingCode ?? response.bookingId}`);
      navigate('/parcels/self-service');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to complete this booking');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <SelfServiceDraftSummaryCard draft={draft} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <ParcelCardDestinationSection
              control={control}
              destinationBranchName="parcels.0.destinationBranchId"
              destinationLocationIdName="parcels.0.destinationLocationId"
              branchOptions={destinationBranchOptions}
              locationOptions={locationOptions}
              destinationBranchId={destinationBranchId}
              locationPlaceholder={locationPlaceholder}
              isLoadingLocations={isLoadingLocations}
              clearErrors={clearErrors}
              onLocationNameChange={(locationId) => {
                const locationName =
                  locationOptions.find((location) => location.id === locationId)?.name ?? '';
                setValue('parcels.0.destinationLocationName', locationName, { shouldDirty: true });
              }}
            />
            <ParcelCardChargeSection
              control={control}
              parcelChargeName="parcels.0.charge"
              parcelPaymentName="parcels.0.paymentResponsibility"
              parcelSettlementName="parcels.0.senderSettlementMode"
              senderPartialPaymentName="parcels.0.senderPartialPayment"
              paymentResponsibility={paymentResponsibility}
              senderIsCreditEligible={senderIsCreditEligible}
              parcelChargeValue={parcelChargeValue}
            />
          </div>

          <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parcel Details</CardTitle>
              <CardDescription className="text-xs">
                Add any staff-facing notes (item description, packaging, etc).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={control}
                name="parcels.0.parcelDetails"
                rules={{
                  required: 'Parcel details are required',
                  validate: (value) =>
                    sanitizeString(value).trim().length ? true : 'Parcel details are required',
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcel Details</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Type parcel details" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
            {isSubmitting ? 'Completing...' : 'Complete Booking'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
