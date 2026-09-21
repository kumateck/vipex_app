import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CallCenterQueueMode } from '../../types';

type Props = {
  value: CallCenterQueueMode;
  showAssigned: boolean;
  showAddresses: boolean;
  onChange: (value: CallCenterQueueMode) => void;
};

export function CallCenterQueueSwitch(props: Props) {
  const { theme } = useAppearance();
  if (!props.showAssigned || !props.showAddresses) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.cardMuted }]}>
      {(
        [
          ['assigned', 'Assigned calls'],
          ['addresses', 'Delivery addresses'],
        ] as const
      ).map(([value, label]) => {
        const active = props.value === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => props.onChange(value)}
            style={[styles.item, { backgroundColor: active ? theme.colors.card : 'transparent' }]}
          >
            <Text
              style={[styles.label, { color: active ? theme.colors.text : theme.colors.textMuted }]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: mobileRadius.md,
    padding: 3,
    gap: 3,
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: mobileRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mobileSpacing.sm,
  },
  label: { ...mobileTextStyles.subhead, fontWeight: '600' },
});
