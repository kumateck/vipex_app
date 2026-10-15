import { SelfServiceDraftDialog } from '../../dialogs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/features/operations/parcel/components/parcel-create';
import { useSelfServiceDraftCompleteWorkflow } from '../../hooks';
import { SelfServiceDraftSummaryCard } from '../self-service-draft-summary-card';

export function SelfServiceDraftComplete() {
  const {
    form,
    control,
    clearErrors,
    destinationBranchId,
    destinationBranchOptions,
    locationOptions,
    isLoadingLocations,
    locationPlaceholder,
    paymentResponsibility,
    parcelChargeValue,
    senderIsCreditEligible,
    draft,
    isLoading,
    isError,
    isSubmitting,
    onSubmit,
    onLocationNameChange,
    isCustomerEditorOpen,
    openCustomerEditor,
    closeCustomerEditor,
  } = useSelfServiceDraftCompleteWorkflow();

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <SelfServiceDraftSummaryCard draft={draft} />
      <Button type="button" variant="outline" onClick={openCustomerEditor}>
        Edit Booking Details
      </Button>
      {isCustomerEditorOpen ? (
        <SelfServiceDraftDialog
          key={`${draft.id}:${draft.updatedAt}`}
          draft={draft}
          canEdit
          onClose={closeCustomerEditor}
        />
      ) : null}

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
              onLocationNameChange={onLocationNameChange}
            />
            <ParcelCardChargeSection
              control={control}
              parcelChargeName="parcels.0.charge"
              parcelChargeAgentName="parcels.0.chargeAgentUserId"
              chargeAgentSource="self-service"
              parcelPaymentName="parcels.0.paymentResponsibility"
              parcelSettlementName="parcels.0.senderSettlementMode"
              senderPartialPaymentName="parcels.0.senderPartialPayment"
              paymentResponsibility={paymentResponsibility}
              senderIsCreditEligible={senderIsCreditEligible}
              parcelChargeValue={parcelChargeValue}
            />
          </div>

          <FormField
            control={control}
            name="parcels.0.callSender"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl>
                <div>
                  <FormLabel>CS — Call Sender before deliver to Receiver</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Tick if the sender asked to be called before the receiver gets the parcel. The
                    receiver details remain on the sticker, with CS marked when selected.
                  </p>
                </div>
              </FormItem>
            )}
          />

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
