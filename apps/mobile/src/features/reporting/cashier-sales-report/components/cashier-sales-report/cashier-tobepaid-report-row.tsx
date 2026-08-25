import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesToBePaidRow } from '../../types';
import { formatReportDateTime, formatReportMoney } from '../../utils';
import { CashierReportDetailLine } from './cashier-report-detail-line';

export function CashierToBePaidReportRow({ row }: { row: CashierSalesToBePaidRow }) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={[styles.booking, { color: theme.colors.text }]}>{row.bookingCode}</Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }]}>
            {formatReportDateTime(row.createdAt)}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.amount, { color: theme.colors.warning }]}
        >
          {formatReportMoney(row.plannedToBePaidPsw)}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
      <CashierReportDetailLine
        label="Parcel"
        value={row.parcelDetails}
        secondary={row.parcelContent}
      />
      <CashierReportDetailLine
        label="Sender"
        value={row.senderName ?? '—'}
        secondary={row.senderTelephone}
      />
      <CashierReportDetailLine
        label="Receiver"
        value={row.receiverName ?? '—'}
        secondary={row.receiverTelephone}
      />
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
});
