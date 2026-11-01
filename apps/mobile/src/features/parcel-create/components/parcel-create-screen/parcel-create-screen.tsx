import { AppScreen } from '@mobile/components/screen';
import { useLocalSearchParams } from '@mobile/navigation/router-compat';
import { AppButton, AppLabel, MobileNoAccess } from '@mobile/components/ui/mobile';
import { PaymentResponsibility } from '@mobile/constants/payment';
import { CustomerLookupCard } from '../../customer-lookup-card';
import { ParcelCreateHeader } from '../parcel-create-header';
import {
  getInitialMobilePaymentResponsibility,
  type MobilePaymentResponsibility,
} from '../../mobile-parcel-payment-plan';
import { useParcelCreateWorkflow } from '../../hooks';
import { ParcelBookingFields } from './parcel-booking-fields';
import { StickerRetryActions } from './sticker-retry-actions';

export function ParcelCreateScreen() {
  const { payment } = useLocalSearchParams<{ payment?: string }>();
  const initialPaymentResponsibility = getInitialMobilePaymentResponsibility(payment);
  return (
    <ParcelCreateForm
      key={initialPaymentResponsibility}
      initialPaymentResponsibility={initialPaymentResponsibility}
    />
  );
}
function ParcelCreateForm({
  initialPaymentResponsibility,
}: {
  initialPaymentResponsibility: MobilePaymentResponsibility;
}) {
  const {
    canCreate,
    isHeadOffice,
    userBranchId,
    sender,
    receiver,
    destinationBranchId,
    setDestinationBranchId,
    pickupLocationId,
    setPickupLocationId,
    parcelDetails,
    setParcelDetails,
    parcelContent,
    setParcelContent,
    parcelValue,
    setParcelValue,
    charge,
    setCharge,
    callSender,
    setCallSender,
    paymentResponsibility,
    setPaymentResponsibility,
    branchOptions,
    isLoadingBranches,
    locationOptions,
    isLoadingLocations,
    pickupLocationError,
    locationsFailed,
    retryLocations,
    isSubmitting,
    printSticker,
    setPrintSticker,
    stickerCopies,
    setStickerCopies,
    stickerPrint,
    handleSubmit,
    chargeAgent,
    exemption,
  } = useParcelCreateWorkflow(initialPaymentResponsibility);
  if (!canCreate || isHeadOffice) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess
          title={isHeadOffice ? 'Not available' : undefined}
          message={
            isHeadOffice
              ? 'Head office users cannot create parcel bookings.'
              : 'You do not have permission to create parcel bookings.'
          }
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ParcelCreateHeader paymentResponsibility={paymentResponsibility} />
      <CustomerLookupCard title="Sender" lookup={sender} />
      <CustomerLookupCard title="Recipient" lookup={receiver} />
      <ParcelBookingFields
        branchOptions={branchOptions}
        locationOptions={locationOptions}
        userBranchId={userBranchId}
        destinationBranchId={destinationBranchId}
        pickupLocationId={pickupLocationId}
        parcelDetails={parcelDetails}
        parcelContent={parcelContent}
        parcelValue={parcelValue}
        charge={charge}
        chargeAgent={chargeAgent}
        exemption={exemption}
        callSender={callSender}
        paymentResponsibility={paymentResponsibility}
        printSticker={printSticker}
        stickerCopies={stickerCopies}
        onPrintStickerChange={setPrintSticker}
        onStickerCopiesChange={setStickerCopies}
        isLoadingBranches={isLoadingBranches}
        isLoadingLocations={isLoadingLocations}
        onDestinationChange={(value) => {
          setDestinationBranchId(value);
          setPickupLocationId('');
        }}
        onPickupLocationChange={setPickupLocationId}
        onParcelDetailsChange={setParcelDetails}
        onParcelContentChange={setParcelContent}
        onParcelValueChange={setParcelValue}
        onChargeChange={setCharge}
        onCallSenderChange={setCallSender}
        onPaymentResponsibilityChange={(value) => {
          setPaymentResponsibility(value);
          if (value !== PaymentResponsibility.RECIPIENT) setPrintSticker(false);
        }}
      />
      {destinationBranchId && pickupLocationError ? (
        <AppLabel>{pickupLocationError}</AppLabel>
      ) : null}
      {locationsFailed ? (
        <AppButton title="Retry pickup locations" variant="plain" onPress={retryLocations} />
      ) : null}
      <AppButton
        title={
          isSubmitting
            ? 'Creating...'
            : exemption.exemptionType != null
              ? 'Create Exempt Booking'
              : paymentResponsibility === PaymentResponsibility.SENDER
                ? 'Create Paid Booking'
                : 'Create TobePaid Booking'
        }
        onPress={() => void handleSubmit()}
        disabled={isSubmitting || Boolean(pickupLocationError)}
        loading={isSubmitting}
      />
      <StickerRetryActions
        pendingSticker={stickerPrint.pendingSticker}
        pendingLog={stickerPrint.pendingLog}
        onRetryPrint={() => void stickerPrint.retry()}
        onRetryLog={() => void stickerPrint.retryLog()}
      />
    </AppScreen>
  );
}
