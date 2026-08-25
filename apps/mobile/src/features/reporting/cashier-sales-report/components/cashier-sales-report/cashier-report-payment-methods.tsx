import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesReport } from '../../types';
import { formatReportMoney } from '../../utils';

export function CashierReportPaymentMethods({ report }: { report: CashierSalesReport | null }) {
  const { theme } = useAppearance();
  const totals = report?.paymentModeTotals;
  const methods = [
    ['Cash', totals?.cashPsw],
    ['MTN', totals?.mtnPsw],
    ['Telecel', totals?.telecelPsw],
    ['AirtelTigo', totals?.airtelPsw],
    ['Credit', totals?.creditPsw],
  ] as const;

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Payment methods</Text>
      <View style={styles.methods}>
        {methods.map(([label, value]) => (
          <View key={label} style={[styles.method, { backgroundColor: theme.colors.cardMuted }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.value, { color: theme.colors.text }]}
            >
              {formatReportMoney(value)}
            </Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.subhead, fontWeight: '700' },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  method: {
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: mobileRadius.sm,
    padding: mobileSpacing.sm,
    gap: 2,
  },
  label: { ...mobileTextStyles.caption2 },
  value: { ...mobileTextStyles.caption1, fontWeight: '700' },
});
