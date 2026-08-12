import { Text } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { BranchType } from '@mobile/constants/branch';
import { PaymentResponsibility } from '@mobile/constants/payment';
import type { BranchOption, LocationOption } from '@mobile/types/booking';
import { mobileTextStyles } from '@mobile/theme/layout';
import { AppCard, AppInput, AppLabel, AppSelectField } from '@mobile/components/ui/mobile';
import type { MobilePaymentResponsibility } from '../../mobile-parcel-payment-plan';

const PAYMENT_RESPONSIBILITY_OPTIONS = [
  { value: String(PaymentResponsibility.SENDER), label: 'Sender pay — complete at cashier' },
  { value: String(PaymentResponsibility.RECIPIENT), label: 'To be paid — receiver pays' },
];

type ParcelBookingFieldsProps = {
  branchOptions: BranchOption[];
  locationOptions: LocationOption[];
  userBranchId: string | null;
  destinationBranchId: string;
  pickupLocationId: string;
  parcelDetails: string;
  parcelContent: string;
  parcelValue: string;
  charge: string;
  paymentResponsibility: MobilePaymentResponsibility;
  isLoadingBranches: boolean;
  isLoadingLocations: boolean;
  onDestinationChange: (value: string) => void;
  onPickupLocationChange: (value: string) => void;
  onParcelDetailsChange: (value: string) => void;
  onParcelContentChange: (value: string) => void;
  onParcelValueChange: (value: string) => void;
  onChargeChange: (value: string) => void;
  onPaymentResponsibilityChange: (value: MobilePaymentResponsibility) => void;
};

export function ParcelBookingFields({
  branchOptions,
  locationOptions,
  userBranchId,
  destinationBranchId,
  pickupLocationId,
  parcelDetails,
  parcelContent,
  parcelValue,
  charge,
  paymentResponsibility,
  isLoadingBranches,
  isLoadingLocations,
  onDestinationChange,
  onPickupLocationChange,
  onParcelDetailsChange,
  onParcelContentChange,
  onParcelValueChange,
  onChargeChange,
  onPaymentResponsibilityChange,
}: ParcelBookingFieldsProps) {
  const { theme } = useAppearance();
  const destinationOptions = branchOptions.reduce<Array<{ value: string; label: string }>>(
    (options, branch) => {
      if (branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE) {
        options.push({ value: branch.id, label: branch.name });
      }
      return options;
    },
    [],
  );
  const locationSelectOptions = locationOptions.map((location) => ({
    value: location.id,
    label: location.name,
  }));

  return (
    <>
      <AppCard>
        <Text style={[mobileTextStyles.headline, { color: theme.colors.text }]}>
          Destination & Location
        </Text>
        <AppSelectField
          label="Destination Branch"
          value={destinationBranchId}
          onValueChange={onDestinationChange}
          options={destinationOptions}
          placeholder="Select destination"
          searchPlaceholder="Search branch..."
          loading={isLoadingBranches}
        />
        <AppSelectField
          label="Pickup Location (optional)"
          value={pickupLocationId}
          onValueChange={onPickupLocationChange}
          options={locationSelectOptions}
          placeholder={destinationBranchId ? 'Select pickup location' : 'Select a branch first'}
          searchPlaceholder="Search location..."
          disabled={!destinationBranchId}
          loading={isLoadingLocations}
        />
      </AppCard>

      <AppCard>
        <Text style={[mobileTextStyles.headline, { color: theme.colors.text }]}>Parcel</Text>
        <AppLabel>Parcel Details</AppLabel>
        <AppInput
          value={parcelDetails}
          onChangeText={onParcelDetailsChange}
          placeholder="e.g. Documents, 1 box"
        />
        <AppLabel>Parcel Content</AppLabel>
        <AppInput
          value={parcelContent}
          onChangeText={onParcelContentChange}
          placeholder="e.g. Clothes and shoes"
        />
        <AppLabel>Parcel Value (GHS, optional)</AppLabel>
        <AppInput
          value={parcelValue}
          onChangeText={onParcelValueChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <AppLabel>Charge (GHS)</AppLabel>
        <AppInput
          value={charge}
          onChangeText={onChargeChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <AppSelectField
          label="Payment Responsibility"
          value={String(paymentResponsibility)}
          onValueChange={(value) =>
            onPaymentResponsibilityChange(Number(value) as MobilePaymentResponsibility)
          }
          options={PAYMENT_RESPONSIBILITY_OPTIONS}
          placeholder="Select who pays"
        />
        <Text style={[mobileTextStyles.footnote, { color: theme.colors.textSubtle }]}>
          Payment and all sticker or receipt printing must be completed from Sender Cashier Payments
          on desktop.
        </Text>
      </AppCard>
    </>
  );
}
