import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesPaymentRow } from '../../types';
import { PAYMENT_METHOD_LABELS, formatReportDateTime, formatReportMoney } from '../../utils';
import { CashierReportDetailLine } from './cashier-report-detail-line';

export function CashierPaymentReportRow({ row }: { row: CashierSalesPaymentRow }) {
  const { theme } = useAppearance();
  const paidColor =
    row.whoPaid.trim().toLowerCase() === 'receiver' ? theme.colors.secondary : theme.colors.primary;
  return (
    <AppCard>
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={[styles.booking, { color: theme.colors.text }]}>{row.bookingCode}</Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }]}>
            {formatReportDateTime(row.receivedAt)}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.amount, { color: theme.colors.success }]}
        >
          {formatReportMoney(row.grossAmountPsw)}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
      <CashierReportDetailLine
        label="Parcel"
        value={row.parcelDetails || row.trackingCode}
        secondary={row.parcelContent || row.trackingCode}
      />
      <CashierReportDetailLine
        label="Customer"
        value={row.payerName}
        secondary={row.payerTelephone}
      />
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: `${paidColor}18` }]}>
          <Text style={[styles.chipText, { color: paidColor }]}>{row.whoPaid} paid</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: theme.colors.cardMuted }]}>
          <Text style={[styles.chipText, { color: theme.colors.textMuted }]}>
            {PAYMENT_METHOD_LABELS[row.method] ?? `Method ${row.method}`}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  topCopy: { flex: 1, minWidth: 0, gap: 1 },
  booking: { ...mobileTextStyles.headline },
  time: { ...mobileTextStyles.caption1 },
  amount: { fontSize: 18, lineHeight: 23, fontWeight: '800', maxWidth: '47%', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  chip: { borderRadius: mobileRadius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { ...mobileTextStyles.caption1, fontWeight: '700' },
});
