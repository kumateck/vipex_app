import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { MobileNoAccess } from '@mobile/components/ui';
import { useLocalSearchParams } from '@mobile/navigation/router-compat';
import { useCashierSalesReport } from '../../hooks';
import { CashierReportHeader } from './cashier-report-header';
import {
  CashierReportResultsList,
  paymentListItems,
  toBePaidListItems,
} from './cashier-report-results-list';

function CashierSalesReportContent({ initialDate }: { initialDate?: string }) {
  const sales = useCashierSalesReport(initialDate);
  const items = useMemo(
    () =>
      sales.tab === 'payments'
        ? paymentListItems(sales.report?.transactions ?? [])
        : toBePaidListItems(sales.report?.toBePaidRows ?? []),
    [sales.report, sales.tab],
  );

  if (!sales.canView) {
    return (
      <AppScreen scrollable={false} style={styles.screen}>
        <MobileNoAccess message="Your role does not have permission to view cashier shift reports." />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false} style={styles.screen}>
      <CashierReportResultsList
        header={<CashierReportHeader sales={sales} />}
        items={items}
        loading={sales.loading}
        refreshing={sales.refreshing}
        emptyMessage={
          sales.tab === 'payments'
            ? 'No sender or receiver payments were recorded for this session open date.'
            : 'No To Be Paid parcels were created for this session open date.'
        }
        onRefresh={sales.refresh}
      />
    </AppScreen>
  );
}

export function CashierSalesReportScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof params.date === 'string' ? params.date : undefined;
  return <CashierSalesReportContent key={initialDate ?? 'today'} initialDate={initialDate} />;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
});
