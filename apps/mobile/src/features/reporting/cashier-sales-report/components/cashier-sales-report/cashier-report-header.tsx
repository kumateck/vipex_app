import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { router } from '@mobile/navigation/router-compat';
import { AppButton, AppPageHeader } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesReportState } from '../../types';
import { CashierReportDateFilter } from './cashier-report-date-filter';
import { CashierReportPaymentMethods } from './cashier-report-payment-methods';
import { CashierReportSummary } from './cashier-report-summary';
import { CashierReportTabs } from './cashier-report-tabs';

export function CashierReportHeader({ sales }: { sales: CashierSalesReportState }) {
  const { theme } = useAppearance();
  const report = sales.report;
  return (
    <>
      <AppPageHeader
        title="Cashier Sales Report"
        subtitle="Payments received and outstanding To Be Paid parcels"
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.cardMuted,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
        }
      />
      <CashierReportDateFilter
        date={sales.selectedDate}
        loading={sales.loading}
        hasPendingDate={sales.hasPendingDate}
        onChangeDate={sales.setSelectedDate}
        onLoad={sales.loadReport}
      />
      {sales.error ? (
        <View style={[styles.error, { backgroundColor: `${theme.colors.danger}12` }]}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Couldn&apos;t load report
          </Text>
          <Text style={[styles.errorBody, { color: theme.colors.textMuted }]}>{sales.error}</Text>
          <AppButton title="Retry" variant="plain" onPress={sales.refresh} />
        </View>
      ) : null}
      <CashierReportSummary report={report} />
      <CashierReportPaymentMethods report={report} />
      <CashierReportTabs
        tab={sales.tab}
        paymentCount={report?.transactions.length ?? 0}
        toBePaidCount={report?.toBePaidRows.length ?? 0}
        onChange={sales.setTab}
      />
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {sales.tab === 'payments' ? 'Payment details' : 'To Be Paid details'}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
          {sales.tab === 'payments'
            ? 'Sender and receiver payments ordered by payment time.'
            : 'Outstanding amounts created during the selected session date.'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { borderRadius: mobileRadius.md, padding: mobileSpacing.md, gap: 3 },
  errorTitle: { ...mobileTextStyles.subhead, fontWeight: '700' },
  errorBody: { ...mobileTextStyles.caption1 },
  sectionHeading: { gap: 2, paddingHorizontal: 2 },
  sectionTitle: { ...mobileTextStyles.headline },
  sectionSubtitle: { ...mobileTextStyles.caption1 },
});
