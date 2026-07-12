import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canCreateParcelBooking } from '@mobile/lib/permissions';
import { BranchType } from '@mobile/constants/branch';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { PaymentMethod, PaymentResponsibility } from '@mobile/constants/payment';
import {
  createBookingWithParcels,
  createCustomer,
  listBranchOptions,
  listLocationOptions,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { hapticError, hapticSuccess } from '@mobile/lib/haptics';
import type { BranchOption, LocationOption } from '@mobile/types/booking';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppSelectField,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileTextStyles } from '@mobile/theme/layout';
import { CustomerLookupCard } from '@mobile/features/parcel-create/customer-lookup-card';
import { ParcelCreateHeader } from '@mobile/features/parcel-create/components/parcel-create-header';
import {
  isTenDigitPhone,
  useCustomerLookup,
  type UseCustomerLookupResult,
} from '@mobile/features/parcel-create/use-customer-lookup';

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const value = Number(normalized);
  if (Number.isNaN(value) || value < 0) return null;
  return value;
}

export default function ParcelCreateScreen() {
  const { theme } = useAppearance();
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

  if (!canCreate) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to create parcel bookings." />
      </AppScreen>
    );
  }

  if (isHeadOffice) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess
          title="Not available"
          message="Head office users cannot create parcel bookings."
        />
      </AppScreen>
    );
  }

  const destinationOptions = branchOptions
    .filter((branch) => branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE)
    .map((branch) => ({ value: branch.id, label: branch.name }));
  const locationSelectOptions = locationOptions.map((location) => ({
    value: location.id,
    label: location.name,
  }));

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
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!companyId || !userBranchId) {
      notifyError('Missing context', 'Your company or branch is missing.');
      return;
    }
    if (!isTenDigitPhone(sender.telephone) || !sender.hasLookedUp) {
      notifyError('Sender required', 'Look up the sender by telephone before continuing.');
      return;
    }
    if (!sender.isExistingCustomer && !sender.fullname.trim()) {
      notifyError('Sender required', 'Enter the sender fullname.');
      return;
    }
    if (!isTenDigitPhone(receiver.telephone) || !receiver.hasLookedUp) {
      notifyError('Receiver required', 'Look up the receiver by telephone before continuing.');
      return;
    }
    if (!receiver.isExistingCustomer && !receiver.fullname.trim()) {
      notifyError('Receiver required', 'Enter the receiver fullname.');
      return;
    }
    if (!destinationBranchId) {
      notifyError('Destination required', 'Select a destination branch.');
      return;
    }
    if (!parcelDetails.trim()) {
      notifyError('Parcel details required', 'Describe the parcel.');
      return;
    }
    if (!parcelContent.trim()) {
      notifyError('Parcel content required', 'Describe the parcel content.');
      return;
    }
    const chargeAmount = parseAmount(charge);
    if (chargeAmount === null || chargeAmount <= 0) {
      notifyError('Invalid charge', 'Enter a valid charge amount.');
      return;
    }
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
          parcels: [
            {
              destinationId: destinationBranchId,
              pickupLocationId: pickupLocationId || null,
              receiverId,
              status: ParcelStatus.CREATED,
              parcelDetails: parcelDetails.trim(),
              parcelContent: parcelContent.trim(),
              method: PaymentMethod.CASH,
              parcelValueCedis: valueAmount,
              chargeCedis: chargeAmount,
              plannedToBePaidCedis: chargeAmount,
              senderPaymentCedis: 0,
              paymentResponsibility: PaymentResponsibility.RECIPIENT,
            },
          ],
        }),
      );

      const created = response.parcels[0];
      notifySuccess(
        `Tracking ${created?.trackingCode ?? '-'} · Booking ${created?.bookingCode ?? response.bookingId}. Receiver pays GHS ${chargeAmount.toFixed(2)} on pickup.`,
        'To-be-paid parcel created',
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
      <ParcelCreateHeader />

      <CustomerLookupCard title="Sender" lookup={sender} />
      <CustomerLookupCard title="Recipient" lookup={receiver} />

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Destination & Location
        </Text>
        <AppSelectField
          label="Destination Branch"
          value={destinationBranchId}
          onValueChange={(value) => {
            setDestinationBranchId(value);
            setPickupLocationId('');
          }}
          options={destinationOptions}
          placeholder="Select destination"
          searchPlaceholder="Search branch..."
          loading={isLoadingBranches}
        />
        <AppSelectField
          label="Pickup Location (optional)"
          value={pickupLocationId}
          onValueChange={setPickupLocationId}
          options={locationSelectOptions}
          placeholder={destinationBranchId ? 'Select pickup location' : 'Select a branch first'}
          searchPlaceholder="Search location..."
          disabled={!destinationBranchId}
          loading={isLoadingLocations}
        />
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel</Text>
        <AppLabel>Parcel Details</AppLabel>
        <AppInput
          value={parcelDetails}
          onChangeText={setParcelDetails}
          placeholder="e.g. Documents, 1 box"
        />
        <AppLabel>Parcel Content</AppLabel>
        <AppInput
          value={parcelContent}
          onChangeText={setParcelContent}
          placeholder="e.g. Clothes and shoes"
        />
        <AppLabel>Parcel Value (GHS, optional)</AppLabel>
        <AppInput
          value={parcelValue}
          onChangeText={setParcelValue}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <AppLabel>Charge (GHS)</AppLabel>
        <AppInput
          value={charge}
          onChangeText={setCharge}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
          The receiver will be asked to pay this full amount at pickup.
        </Text>
      </AppCard>

      <AppButton
        title={isSubmitting ? 'Creating...' : 'Create To-Be-Paid Booking'}
        onPress={() => void handleSubmit()}
        disabled={isSubmitting}
        loading={isSubmitting}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...mobileTextStyles.headline },
  helper: { ...mobileTextStyles.footnote },
});
