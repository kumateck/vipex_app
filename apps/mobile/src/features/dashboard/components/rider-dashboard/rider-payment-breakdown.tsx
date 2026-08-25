import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatMoneyPsw } from '../../utils';

function PaymentRow(props: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  detail: string;
  amountPsw: number;
  color: string;
}) {
  const { theme } = useAppearance();
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${props.color}16` }]}>
        <Ionicons name={props.icon} size={19} color={props.color} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{props.label}</Text>
        <Text style={[styles.detail, { color: theme.colors.textSubtle }]}>{props.detail}</Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.amount, { color: theme.colors.text }]}
      >
        {formatMoneyPsw(props.amountPsw)}
      </Text>
    </View>
  );
}

export function RiderPaymentBreakdown(props: {
  toBePaidReceivedPsw: number;
  deliveryFeeReceivedPsw: number;
}) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Collection breakdown</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            Cash held by rider today
          </Text>
        </View>
        <View style={[styles.receiptIcon, { backgroundColor: theme.colors.cardMuted }]}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
      <PaymentRow
        icon="swap-horizontal-outline"
        label="To-be-paid collected"
        detail="In-transit parcel amount"
        amountPsw={props.toBePaidReceivedPsw}
        color={theme.colors.secondary}
      />
      <PaymentRow
        icon="bicycle-outline"
        label="Delivery fee"
        detail="Doorstep delivery charge"
        amountPsw={props.deliveryFeeReceivedPsw}
        color={theme.colors.success}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...mobileTextStyles.headline },
  subtitle: { ...mobileTextStyles.caption1, marginTop: 2 },
  receiptIcon: {
    width: 38,
    height: 38,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  icon: {
    width: 40,
    height: 40,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  label: { ...mobileTextStyles.subhead, fontWeight: '700' },
  detail: { ...mobileTextStyles.caption2, marginTop: 1 },
  amount: { ...mobileTextStyles.subhead, maxWidth: '34%', fontWeight: '800', textAlign: 'right' },
});
