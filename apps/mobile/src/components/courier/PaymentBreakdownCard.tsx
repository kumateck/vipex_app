import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTypography } from '@mobile/theme/layout';

type PaymentBreakdownCardProps = {
  deliveryFeePsw: number;
  transitFeePsw: number;
  senderPaidTransit: boolean;
};

function formatPsw(amountPsw: number) {
  return `GH₵ ${(amountPsw / 100).toFixed(2)}`;
}

export function PaymentBreakdownCard({
  deliveryFeePsw,
  transitFeePsw,
  senderPaidTransit,
}: PaymentBreakdownCardProps) {
  const { theme } = useAppearance();
  const collectTransit = senderPaidTransit ? 0 : transitFeePsw;
  const total = deliveryFeePsw + collectTransit;

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Payment Breakdown</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Delivery Fee</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatPsw(deliveryFeePsw)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Transit Fee</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatPsw(collectTransit)}
        </Text>
      </View>
      <View style={[styles.row, styles.total]}>
        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total To Collect</Text>
        <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{formatPsw(total)}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: mobileTypography.body, fontWeight: '600' },
  value: { fontSize: mobileTypography.body, fontWeight: '700' },
  total: { paddingTop: 4 },
  totalLabel: { fontSize: mobileTypography.body, fontWeight: '800' },
  totalValue: { fontSize: mobileTypography.sectionTitle, fontWeight: '800' },
});
