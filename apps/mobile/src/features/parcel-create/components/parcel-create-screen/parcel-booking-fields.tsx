import { Text } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { BranchType } from '@mobile/constants/branch';
import type { BranchOption, LocationOption } from '@mobile/types/booking';
import { mobileTextStyles } from '@mobile/theme/layout';
import { AppCard, AppInput, AppLabel, AppSelectField } from '@mobile/components/ui/mobile';

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
  isLoadingBranches: boolean;
  isLoadingLocations: boolean;
  onDestinationChange: (value: string) => void;
  onPickupLocationChange: (value: string) => void;
  onParcelDetailsChange: (value: string) => void;
  onParcelContentChange: (value: string) => void;
  onParcelValueChange: (value: string) => void;
  onChargeChange: (value: string) => void;
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
  isLoadingBranches,
  isLoadingLocations,
  onDestinationChange,
  onPickupLocationChange,
  onParcelDetailsChange,
  onParcelContentChange,
  onParcelValueChange,
  onChargeChange,
}: ParcelBookingFieldsProps) {
  const { theme } = useAppearance();
  const destinationOptions = branchOptions
    .filter((branch) => branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE)
    .map((branch) => ({ value: branch.id, label: branch.name }));
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
        <Text style={[mobileTextStyles.footnote, { color: theme.colors.textSubtle }]}>
          The receiver will be asked to pay this full amount at pickup.
        </Text>
      </AppCard>
    </>
  );
}
