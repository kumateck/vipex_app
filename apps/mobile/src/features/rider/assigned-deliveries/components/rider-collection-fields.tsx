import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppInput, AppLabel } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  principal: string;
  deliveryFee: string;
  disabled?: boolean;
  onPrincipalChange: (value: string) => void;
  onDeliveryFeeChange: (value: string) => void;
};

export const RiderCollectionFields = memo(function RiderCollectionFields(props: Props) {
  const { theme } = useAppearance();
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Amount collected</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
          Cash currently held by the rider.
        </Text>
      </View>
      <View style={[styles.note, { backgroundColor: `${theme.colors.primary}12` }]}>
        <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.noteText, { color: theme.colors.textMuted }]}>
          The delivery cashier will create the official payment when you return to the office.
        </Text>
      </View>
      <View style={styles.amounts}>
        <View style={styles.field}>
          <AppLabel>To-be-paid collected (GHS)</AppLabel>
          <AppInput
            value={props.principal}
            onChangeText={props.onPrincipalChange}
            inputMode="decimal"
            keyboardType="decimal-pad"
            editable={!props.disabled}
          />
        </View>
        <View style={styles.field}>
          <AppLabel>Delivery fee collected (GHS)</AppLabel>
          <AppInput
            value={props.deliveryFee}
            onChangeText={props.onDeliveryFeeChange}
            inputMode="decimal"
            keyboardType="decimal-pad"
            editable={!props.disabled}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: mobileSpacing.sm },
  title: { ...mobileTextStyles.subhead, fontWeight: '700' },
  subtitle: { ...mobileTextStyles.caption1, marginTop: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mobileSpacing.xs,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm,
  },
  noteText: { ...mobileTextStyles.caption1, flex: 1 },
  amounts: { flexDirection: 'row', gap: mobileSpacing.sm },
  field: { flex: 1, minWidth: 0, gap: 5 },
});
