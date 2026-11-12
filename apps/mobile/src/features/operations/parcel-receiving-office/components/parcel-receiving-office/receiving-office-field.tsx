import { Text } from 'react-native';
import { AppSelectField } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { pickupOfficeLabel, type ReceivingOfficeOption } from '@/shared/shipments/receiving-office';

const AUTOMATIC = 'automatic';

export function ReceivingOfficeField({
  options,
  officeId,
  setOfficeId,
  isLoading,
  isError,
  allowAutomatic,
  disabled,
}: {
  options: readonly ReceivingOfficeOption[];
  officeId: string;
  setOfficeId: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  allowAutomatic?: boolean;
  disabled?: boolean;
}) {
  const { theme } = useAppearance();
  if (isError)
    return (
      <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
        Could not load receiving offices.
      </Text>
    );
  if (!isLoading && !options.length) return null;

  const items = options.map((option) => ({
    value: option.id,
    label: pickupOfficeLabel(option.locationName, option.name),
  }));
  if (allowAutomatic) items.unshift({ value: AUTOMATIC, label: 'Use the location’s only office' });
  return (
    <AppSelectField
      label="Receiving office"
      value={officeId || (allowAutomatic ? AUTOMATIC : '')}
      options={items}
      onValueChange={(value) => setOfficeId(value === AUTOMATIC ? '' : value)}
      placeholder="Select receiving office"
      loading={isLoading}
      disabled={isLoading || disabled}
    />
  );
}
