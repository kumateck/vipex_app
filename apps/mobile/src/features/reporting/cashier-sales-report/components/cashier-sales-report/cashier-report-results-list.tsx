import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CashierSalesPaymentRow, CashierSalesToBePaidRow } from '../../types';
import { CashierPaymentReportRow } from './cashier-payment-report-row';
import { CashierToBePaidReportRow } from './cashier-tobepaid-report-row';

type ReportListItem =
  | { kind: 'payment'; row: CashierSalesPaymentRow }
  | { kind: 'tobepaid'; row: CashierSalesToBePaidRow };

function renderItem({ item }: { item: ReportListItem }) {
  return item.kind === 'payment' ? (
    <CashierPaymentReportRow row={item.row} />
  ) : (
    <CashierToBePaidReportRow row={item.row} />
  );
}

function keyExtractor(item: ReportListItem) {
  return item.kind === 'payment' ? item.row.paymentId : item.row.parcelId;
}

function Separator() {
  return <View style={styles.separator} />;
}

export function CashierReportResultsList(props: {
  header: ReactElement;
  items: ReportListItem[];
  loading: boolean;
  refreshing: boolean;
  emptyMessage: string;
  onRefresh: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <FlatList
      style={styles.list}
      data={props.items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={props.header}
      ListHeaderComponentStyle={styles.header}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      windowSize={7}
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      ListEmptyComponent={
        props.loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Loading report details...
            </Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={32} color={theme.colors.textSubtle} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {props.emptyMessage}
            </Text>
          </View>
        )
      }
    />
  );
}

export function paymentListItems(rows: CashierSalesPaymentRow[]): ReportListItem[] {
  return rows.map((row) => ({ kind: 'payment', row }));
}

export function toBePaidListItems(rows: CashierSalesToBePaidRow[]): ReportListItem[] {
  return rows.map((row) => ({ kind: 'tobepaid', row }));
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: mobileSpacing.lg,
    paddingTop: mobileSpacing.md,
    paddingBottom: mobileSpacing.xxxl,
    flexGrow: 1,
  },
  header: { gap: mobileSpacing.md, marginBottom: mobileSpacing.md },
  separator: { height: mobileSpacing.md },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.xxxl,
  },
  emptyText: { ...mobileTextStyles.footnote, textAlign: 'center' },
});
