import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, AppLabel, AppSelectField } from '@mobile/components/ui/mobile';
import type { AppSelectOption } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  destination: {
    branchId: string;
    onBranchChange: (value: string) => void;
    branchOptions: AppSelectOption[];
    isLoadingBranches: boolean;
    locationId: string;
    onLocationChange: (value: string) => void;
    locationOptions: AppSelectOption[];
    isLoadingLocations: boolean;
    locationsFailed: boolean;
    retryLocations: () => void;
  };
  parcel: {
    content: string;
    setContent: (value: string) => void;
    value: string;
    setValue: (value: string) => void;
  };
  error: string | null;
};

export function SelfServiceParcelFields({ destination, parcel, error }: Props) {
  const { theme } = useAppearance();
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Destination & parcel</Text>
      <AppSelectField
        label="Destination branch"
        value={destination.branchId}
        options={destination.branchOptions}
        onValueChange={destination.onBranchChange}
        loading={destination.isLoadingBranches}
        placeholder="Select destination branch"
      />
      <AppSelectField
        label="Pickup location"
        value={destination.locationId}
        options={destination.locationOptions}
        onValueChange={destination.onLocationChange}
        loading={destination.isLoadingLocations}
        disabled={
          !destination.branchId || destination.isLoadingLocations || destination.locationsFailed
        }
        placeholder={destination.branchId ? 'Select location' : 'Select destination branch first'}
      />
      {destination.locationsFailed ? (
        <AppButton
          title="Retry pickup locations"
          variant="plain"
          onPress={destination.retryLocations}
        />
      ) : null}
      <AppLabel>What&apos;s inside the parcel</AppLabel>
      <AppInput value={parcel.content} onChangeText={parcel.setContent} multiline maxLength={255} />
      <AppLabel>Declared value (GHS)</AppLabel>
      <AppInput
        value={parcel.value}
        onChangeText={parcel.setValue}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: mobileSpacing.xs },
  title: { ...mobileTextStyles.headline },
  error: { ...mobileTextStyles.footnote },
});
