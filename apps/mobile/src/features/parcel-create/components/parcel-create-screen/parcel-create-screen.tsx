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
  listBranchOptions,
  listLocationOptions,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { hapticError, hapticSuccess } from '@mobile/lib/haptics';
import type { BranchOption, LocationOption } from '@mobile/types/booking';
import { AppButton, MobileNoAccess } from '@mobile/components/ui/mobile';
import { CustomerLookupCard } from '../../customer-lookup-card';
import {
  isTenDigitPhone,
  useCustomerLookup,
  type UseCustomerLookupResult,
} from '../../use-customer-lookup';
import { ParcelCreateHeader } from '../parcel-create-header';
import {
  buildMobileParcelPaymentPlan,
  getInitialMobilePaymentResponsibility,
  type MobilePaymentResponsibility,
} from '../../mobile-parcel-payment-plan';
import { ParcelBookingFields } from './parcel-booking-fields';

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const value = Number(normalized);
  return Number.isNaN(value) || value < 0 ? null : value;
}

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
          error instanceof Error ? error.message : 'Please try again',
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
          error instanceof Error ? error.message : 'Please try again',
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

  async function resolveCustomerId(person: UseCustomerLookupResult, label: string) {
    if (person.customerId) return person.customerId;
    const fullname = person.fullname.trim();
    if (!fullname) throw new Error(`${label} fullname is required`);
    const result = await withAuth((token) =>
      createCustomer(token, {
        fullname,
        telephone: person.telephone,
        telephone2: person.telephone2 || null,
      }),
    );
    return result.id;
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
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!companyId || !userBranchId)
      return notifyError('Missing context', 'Your company or branch is missing.');
    if (!isTenDigitPhone(sender.telephone) || !sender.hasLookedUp)
      return notifyError('Sender required', 'Look up the sender by telephone before continuing.');
    if (!sender.isExistingCustomer && !sender.fullname.trim())
      return notifyError('Sender required', 'Enter the sender fullname.');
    if (!isTenDigitPhone(receiver.telephone) || !receiver.hasLookedUp)
      return notifyError(
        'Receiver required',
        'Look up the receiver by telephone before continuing.',
      );
    if (!receiver.isExistingCustomer && !receiver.fullname.trim())
      return notifyError('Receiver required', 'Enter the receiver fullname.');
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

    setIsSubmitting(true);
    try {
      const [senderId, receiverId] = await Promise.all([
        resolveCustomerId(sender, 'Sender'),
        resolveCustomerId(receiver, 'Recipient'),
      ]);
      const response = await withAuth((token) =>
        createBookingWithParcels(token, {
          senderId,
          status: ParcelStatus.CREATED,
          deferSenderCashierCompletion: true,
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
      notifySuccess(
        `Tracking ${created?.trackingCode ?? '-'} · Booking ${created?.bookingCode ?? response.bookingId}. Complete this transaction from Sender Cashier Payments; mobile printing is disabled.`,
        'Parcel queued for sender cashier',
      );
      void hapticSuccess();
      resetForm();
    } catch (error) {
      notifyError(
        'Failed to create parcel',
        error instanceof Error ? error.message : 'Please try again',
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
        onPaymentResponsibilityChange={setPaymentResponsibility}
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
    </AppScreen>
  );
}
