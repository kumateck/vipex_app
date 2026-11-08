import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export type ChoiceOption<T extends string> = { value: T; label: string; disabled?: boolean };

type Props<T extends string> = {
  label?: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

function PickupChoiceChipsInner<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: Props<T>) {
  const { theme } = useAppearance();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{label}</Text>
      ) : null}
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option.value === value;
          const isDisabled = disabled || option.disabled;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? `${theme.colors.primary}1F` : theme.colors.inputBg,
                  opacity: isDisabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.chipText,
                  { color: selected ? theme.colors.primary : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const PickupChoiceChips = memo(PickupChoiceChipsInner) as typeof PickupChoiceChipsInner;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...mobileTextStyles.eyebrow, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
  },
  chipText: { ...mobileTextStyles.subhead, fontWeight: '600' },
});
