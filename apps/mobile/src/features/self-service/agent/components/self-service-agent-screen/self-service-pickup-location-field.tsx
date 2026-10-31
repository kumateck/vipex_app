import { Text } from 'react-native';
import { AppButton, AppSelectField } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import type { LocationOption } from '@mobile/types/booking';

type Props = {
  value: string;
  options: LocationOption[];
  loading: boolean;
  failed: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onRetry: () => void;
};
export function SelfServicePickupLocationField(props: Props) {
  const { theme } = useAppearance();
  return (
    <>
      <AppSelectField
        label="Pickup location"
        value={props.value}
        options={props.options.map((location) => ({ value: location.id, label: location.name }))}
        onValueChange={props.onChange}
        placeholder={props.failed ? 'Could not load locations' : 'Select location'}
        loading={props.loading}
        disabled={props.loading || props.failed || props.options.length === 0}
      />
      {props.error ? (
        <Text style={[mobileTextStyles.subhead, { color: theme.colors.danger }]}>
          {props.error}
        </Text>
      ) : null}
      {props.failed ? (
        <AppButton title="Retry pickup locations" variant="plain" onPress={props.onRetry} />
      ) : null}
    </>
  );
}
