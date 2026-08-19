import { Plus } from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BranchType } from '@/db/schemas/enums';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  CustomerLookupSection,
  ExistingCustomerEditAction,
  ParcelCard,
  ParcelCreateSenderPaymentDialog,
  ParcelReceipts,
  useParcelCreateFormWorkflow,
} from './parcel-create';

export function ParcelCreateForm() {
  const {
    form,
    fields,
    append,
    remove,
    openParcels,
    setOpenParcels,
    latestReceipt,
    shouldPrintOnSubmit,
    setShouldPrintOnSubmit,
    canPrintAfterSubmit,
    senderPayment,
    destinationBranchOptions,
    userBranchType,
    companyId,
    isSaving,
    submitDisabled,
    onSubmit,
    handleCancel,
    createEmptyParcel,
  } = useParcelCreateFormWorkflow();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Create Parcel Booking</h2>
              <p className="text-sm text-muted-foreground">
                Confirm the source branch and default parcel status for this booking.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
                <Checkbox
                  id="print-parcel-receipt-on-submit"
                  checked={shouldPrintOnSubmit}
                  disabled={!canPrintAfterSubmit}
                  onCheckedChange={(checked) => setShouldPrintOnSubmit(Boolean(checked))}
                />
                <Label
                  htmlFor="print-parcel-receipt-on-submit"
                  className="text-sm font-normal cursor-pointer"
                >
                  Print after submit
                </Label>
              </div>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled} className="gap-2">
                {isSaving ? <Spinner /> : null}
                {isSaving ? 'Saving...' : 'Save Booking'}
              </Button>
            </div>
          </div>

          <ScrollableWrapper>
            <div className="space-y-5">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sender</CardTitle>
                    <CardDescription>
                      Search by phone to reuse existing customer records.
                    </CardDescription>
                    <ExistingCustomerEditAction
                      label="Sender"
                      phoneName="sender.telephone"
                      customerIdName="sender.customerId"
                      fullnameName="sender.fullname"
                      secondaryPhoneName="sender.telephone2"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <CustomerLookupSection
                        label="Sender"
                        phoneName="sender.telephone"
                        secondaryPhoneName="sender.telephone2"
                        customerIdName="sender.customerId"
                        fullnameName="sender.fullname"
                        helperText="Lookup starts after 1 second when exactly 10 digits are entered."
                        layout="split"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Parcels</CardTitle>
                  <CardDescription>
                    Each parcel can have its own recipient, destination branch, and pickup location.
                  </CardDescription>
                  <CardAction>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        append(createEmptyParcel());
                        setOpenParcels((prev) =>
                          Object.fromEntries(Object.entries(prev).map(([key]) => [key, false])),
                        );
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Parcel
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 pr-2">
                    {fields.map((field, index) => (
                      <ParcelCard
                        key={field.id}
                        index={index}
                        canRemove={fields.length > 1}
                        onRemove={() => {
                          remove(index);
                          setOpenParcels((prev) => {
                            const copy = { ...prev };
                            delete copy[field.id];
                            return copy;
                          });
                        }}
                        companyId={companyId}
                        branchOptions={destinationBranchOptions}
                        isOpen={openParcels[field.id] ?? index === fields.length - 1}
                        onOpenChange={(open) =>
                          setOpenParcels((prev) => ({
                            ...prev,
                            [field.id]: open,
                          }))
                        }
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {canPrintAfterSubmit
                      ? 'All parcels will be saved under a single booking. You will be asked to collect any sender payment as part of saving this booking.'
                      : 'All parcels will be saved under a single booking. Sender payments are collected later from the Sender Payments page.'}
                  </p>
                  {userBranchType === BranchType.HEADOFFICE ? (
                    <p className="text-xs text-destructive">
                      Parcel creation is disabled for head office branches.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </ScrollableWrapper>
        </form>
      </Form>

      <ParcelReceipts receipt={latestReceipt} autoPrint={shouldPrintOnSubmit} />
      <ParcelCreateSenderPaymentDialog
        parcels={senderPayment.pendingParcels}
        paymentMethod={senderPayment.paymentMethod}
        onPaymentMethodChange={senderPayment.setPaymentMethod}
        momoTransactionId={senderPayment.momoTransactionId}
        onMomoConfirmed={senderPayment.setMomoTransactionId}
        isSubmitting={senderPayment.isSubmittingPayment}
        onClose={senderPayment.closePaymentDialog}
        onSubmit={senderPayment.handlePayAndPrint}
      />
    </div>
  );
}
