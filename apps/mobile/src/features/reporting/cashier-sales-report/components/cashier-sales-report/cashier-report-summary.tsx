import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesReport } from '../../types';
import { formatReportMoney } from '../../utils';

function Total({ label, value, accent }: { label: string; value: string; accent: string }) {
  const { theme } = useAppearance();
  return (
    <View style={styles.total}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: accent }]}>
        {value}
      </Text>
    </View>
  );
}

export function CashierReportSummary({ report }: { report: CashierSalesReport | null }) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Report totals</Text>
        <Text style={[styles.count, { color: theme.colors.textMuted }]}>
          {report?.totals.sessions ?? 0} session · {report?.totals.transactions ?? 0} payments
        </Text>
      </View>
      <View style={styles.grid}>
        <Total
          label="Payments"
          value={formatReportMoney(report?.totals.grossPsw)}
          accent={theme.colors.success}
        />
        <Total
          label="To Be Paid"
          value={formatReportMoney(report?.totals.toBePaidPsw)}
          accent={theme.colors.warning}
        />
        <Total
          label="Sender paid"
          value={formatReportMoney(report?.cashierTypeTotals.senderPsw)}
          accent={theme.colors.primary}
        />
        <Total
          label="Receiver paid"
          value={formatReportMoney(report?.cashierTypeTotals.receiverPsw)}
          accent={theme.colors.secondary}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  title: { ...mobileTextStyles.subhead, fontWeight: '700' },
  count: { ...mobileTextStyles.caption2, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: mobileSpacing.md },
  total: { width: '50%', minWidth: 0, paddingRight: mobileSpacing.sm, gap: 1 },
  label: { ...mobileTextStyles.caption1 },
  value: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.15 },
});
