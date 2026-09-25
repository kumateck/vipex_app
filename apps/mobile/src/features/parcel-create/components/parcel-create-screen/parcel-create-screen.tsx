import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useEffect, useState } from 'react';
import { AppScreen } from '@mobile/components/screen';
import { useLocalSearchParams } from '@mobile/navigation/router-compat';
import { useAuth } from '@mobile/providers/auth-provider';
import { canCreateParcelBooking } from '@mobile/lib/permissions';
import { BranchType } from '@mobile/constants/branch';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { PaymentResponsibility } from '@mobile/constants/payment';
import {
  createBookingWithParcels,
  createCustomer,
  findCustomersByTelephone,
  listBranchOptions,
  listLocationOptions,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { hapticError, hapticSuccess } from '@mobile/lib/haptics';
import type { BranchOption, LocationOption } from '@mobile/types/booking';
import { AppButton, MobileNoAccess } from '@mobile/components/ui/mobile';
import { CustomerLookupCard } from '../../customer-lookup-card';
import { isTenDigitPhone, useCustomerLookup } from '../../use-customer-lookup';
import { resolveBookingCustomer } from '../..';
import { ParcelCreateHeader } from '../parcel-create-header';
import {
  buildMobileParcelPaymentPlan,
  getInitialMobilePaymentResponsibility,
  type MobilePaymentResponsibility,
} from '../../mobile-parcel-payment-plan';
import { ParcelBookingFields } from './parcel-booking-fields';
import type { MobileSticker } from '../../services';
import { useMobileStickerPrint } from '../../hooks';
import { parseAmount } from '../../utils';
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
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canCreate = canCreateParcelBooking(permissions);
  const branchType = session.user?.branchType ?? session.user?.branch?.type ?? null;
  const isHeadOffice = branchType === BranchType.HEADOFFICE;
  const companyId = session.user?.company?.id ?? session.user?.companyId ?? null;
  const userBranchId = session.user?.branch?.id ?? session.user?.branchId ?? null;
  const sender = useCustomerLookup(withAuth);
  const receiver = useCustomerLookup(withAuth);
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [parcelDetails, setParcelDetails] = useState('');
  const [parcelContent, setParcelContent] = useState('');
  const [parcelValue, setParcelValue] = useState('');
  const [charge, setCharge] = useState('');
  const [paymentResponsibility, setPaymentResponsibility] = useState<MobilePaymentResponsibility>(
    initialPaymentResponsibility,
  );
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printSticker, setPrintSticker] = useState(false);
  const [stickerCopies, setStickerCopies] = useState('1');
  const stickerPrint = useMobileStickerPrint();
  useEffect(() => {
    if (!companyId || !canCreate || isHeadOffice) return;
    let cancelled = false;
    setIsLoadingBranches(true);
    withAuth((token) => listBranchOptions(token, { companyId }))
      .then((options) => {
        if (!cancelled) setBranchOptions(options);
      })
      .catch((error) => {
        notifyError(
          'Failed to load branches',
          getMobileErrorMessage(error, '') || 'Please try again',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBranches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, canCreate, isHeadOffice, withAuth]);

  useEffect(() => {
    if (!companyId || !destinationBranchId) {
      setLocationOptions([]);
      return;
    }
    let cancelled = false;
    setIsLoadingLocations(true);
    withAuth((token) => listLocationOptions(token, { companyId, branchId: destinationBranchId }))
      .then((options) => {
        if (!cancelled) setLocationOptions(options);
      })
      .catch((error) => {
        notifyError(
          'Failed to load locations',
          getMobileErrorMessage(error, '') || 'Please try again',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLocations(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, destinationBranchId, withAuth]);
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

  const resetForm = () => {
    sender.reset();
    receiver.reset();
    setDestinationBranchId('');
    setPickupLocationId('');
    setParcelDetails('');
    setParcelContent('');
    setParcelValue('');
    setCharge('');
    setPaymentResponsibility(initialPaymentResponsibility);
    setPrintSticker(false);
    setStickerCopies('1');
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!companyId || !userBranchId)
      return notifyError('Missing context', 'Your company or branch is missing.');
    if (!isTenDigitPhone(sender.telephone))
      return notifyError('Sender required', 'Enter the sender telephone.');
    if (sender.telephone2 && !isTenDigitPhone(sender.telephone2))
      return notifyError('Invalid sender number', 'Telephone 2 must have 10 digits.');
    if (!isTenDigitPhone(receiver.telephone))
      return notifyError('Receiver required', 'Enter the receiver telephone.');
    if (receiver.telephone2 && !isTenDigitPhone(receiver.telephone2))
      return notifyError('Invalid receiver number', 'Telephone 2 must have 10 digits.');
    if (!destinationBranchId)
      return notifyError('Destination required', 'Select a destination branch.');
    if (!parcelDetails.trim())
      return notifyError('Parcel details required', 'Describe the parcel.');
    if (!parcelContent.trim())
      return notifyError('Parcel content required', 'Describe the parcel content.');
    const chargeAmount = parseAmount(charge);
    if (chargeAmount === null || chargeAmount <= 0)
      return notifyError('Invalid charge', 'Enter a valid charge amount.');
    const valueAmount = parseAmount(parcelValue) ?? 0;
    const copies = Number(stickerCopies);
    if (
      printSticker &&
      paymentResponsibility === PaymentResponsibility.RECIPIENT &&
      (!Number.isSafeInteger(copies) || copies < 1)
    )
      return notifyError(
        'Invalid sticker copies',
        'Enter a positive whole number of sticker copies.',
      );

    setIsSubmitting(true);
    try {
      const customerDependencies = {
        find: (telephone: string) =>
          withAuth((token) => findCustomersByTelephone(token, { telephone })),
        create: (input: { fullname: string; telephone: string; telephone2: string | null }) =>
          withAuth((token) => createCustomer(token, input)),
      };
      const [senderId, receiverId] = await Promise.all([
        resolveBookingCustomer(sender, 'Sender', customerDependencies),
        resolveBookingCustomer(receiver, 'Recipient', customerDependencies),
      ]);
      const response = await withAuth((token) =>
        createBookingWithParcels(token, {
          senderId,
          status: ParcelStatus.CREATED,
          deferSenderCashierCompletion: !(
            printSticker && paymentResponsibility === PaymentResponsibility.RECIPIENT
          ),
          completeToBePaid:
            printSticker && paymentResponsibility === PaymentResponsibility.RECIPIENT,
          parcels: [
            {
              destinationId: destinationBranchId,
              pickupLocationId: pickupLocationId || null,
              receiverId,
              status: ParcelStatus.CREATED,
              parcelDetails: parcelDetails.trim(),
              parcelContent: parcelContent.trim(),
              parcelValueCedis: valueAmount,
              chargeCedis: chargeAmount,
              ...buildMobileParcelPaymentPlan(paymentResponsibility, chargeAmount),
            },
          ],
        }),
      );
      const created = response.parcels[0];
      let printCompleted = true;
      if (printSticker && created) {
        const sticker: MobileSticker = {
          bookingCode: created.bookingCode,
          trackingCode: created.trackingCode,
          senderName: sender.fullname,
          senderPhone: [sender.telephone, sender.telephone2].filter(Boolean).join(' / '),
          receiverName: receiver.fullname,
          receiverPhone: [receiver.telephone, receiver.telephone2].filter(Boolean).join(' / '),
          destinationBranch:
            branchOptions.find((branch) => branch.id === destinationBranchId)?.name ?? '-',
          destinationLocation:
            locationOptions.find((location) => location.id === pickupLocationId)?.name ?? '-',
          parcelDetails: parcelDetails.trim(),
          amountCedis: chargeAmount,
          copies,
        };
        printCompleted = await stickerPrint.print(sticker);
      }
      if (printCompleted)
        notifySuccess(
          printSticker
            ? `Booking ${created?.bookingCode ?? response.bookingId} completed in the cashier session.`
            : `Booking ${created?.bookingCode ?? response.bookingId} queued for Sender Cashier Payments.`,
          printSticker ? 'To-be-paid parcel completed' : 'Parcel queued for sender cashier',
        );
      void hapticSuccess();
      resetForm();
    } catch (error) {
      notifyError(
        'Failed to create parcel',
        getMobileErrorMessage(error, '') || 'Please try again',
      );
      void hapticError();
    } finally {
      setIsSubmitting(false);
    }
  };
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
        onPaymentResponsibilityChange={(value) => {
          setPaymentResponsibility(value);
          if (value !== PaymentResponsibility.RECIPIENT) setPrintSticker(false);
        }}
      />
      <AppButton
        title={
          isSubmitting
            ? 'Creating...'
            : paymentResponsibility === PaymentResponsibility.SENDER
              ? 'Create Paid Booking'
              : 'Create TobePaid Booking'
        }
        onPress={() => void handleSubmit()}
        disabled={isSubmitting}
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
