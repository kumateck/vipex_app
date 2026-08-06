import { router, useLocalSearchParams } from '@mobile/navigation/router-compat';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { ParcelCard, PaymentBreakdownCard } from '@mobile/components/courier';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@mobile/components/ui';
import {
  doorstepToParcelRow,
  formatCedisFromPsw,
  isCompletedStatus,
  toDateKey,
  useRiderBoardData,
} from '@mobile/features/rider/hooks/use-rider-board-data';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.detailRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

export default function RiderHistoryScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof params.date === 'string' && params.date.trim() ? params.date : '';
  const [search, setSearch] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const { theme } = useAppearance();
  const { canView, currentRows, historyRows, refreshing, load } = useRiderBoardData(initialDate);

  const historyListByDate = useMemo(() => {
    const allSuccessful = historyRows.filter((row) => isCompletedStatus(row.deliveryStatus));
    if (!initialDate) return allSuccessful;
    return allSuccessful.filter((row) => toDateKey(row.updatedAt ?? row.createdAt) === initialDate);
  }, [historyRows, initialDate]);

  const historyList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return historyListByDate;
    return historyListByDate.filter((row) => {
      const haystack = [
        row.bookingCode,
        row.receiverName ?? '',
        row.receiverPhone ?? '',
        row.parcelDetails ?? '',
        row.parcelContent ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [historyListByDate, search]);

  const selectedRow = useMemo(() => {
    if (!selectedParcelId) return null;
    return (
      currentRows.find((row) => row.parcelId === selectedParcelId) ??
      historyRows.find((row) => row.parcelId === selectedParcelId) ??
      null
    );
  }, [currentRows, historyRows, selectedParcelId]);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access rider operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={() => void load()}>
      <AppPageHeader title="Delivery History" subtitle="Completed rider deliveries" />
      <AppButton
        title="Back to Rider Dashboard"
        variant="secondary"
        onPress={() => router.back()}
      />

      <AppInput value={search} onChangeText={setSearch} placeholder="Search history..." />

      {refreshing ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : historyList.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No delivery history found.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {historyList.map((item) => (
            <ParcelCard
              key={`history-${item.parcelId}`}
              parcel={doorstepToParcelRow(item)}
              onPress={() => setSelectedParcelId(item.parcelId)}
              actionLabel="Open Parcel"
            />
          ))}
        </View>
      )}

      {selectedRow ? (
        <AppCard>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel Details</Text>
            <AppStatusChip label={selectedRow.deliveryStatus} />
          </View>
          <View style={styles.detailList}>
            <DetailRow first label="Booking" value={selectedRow.bookingCode} />
            <DetailRow label="Receiver" value={selectedRow.receiverName ?? '-'} />
            <DetailRow label="Phone" value={selectedRow.receiverPhone ?? '-'} />
            <DetailRow label="Address" value={selectedRow.dropoffAddress ?? '-'} />
            <DetailRow label="Amount Paid" value={formatCedisFromPsw(selectedRow.amountPaidPsw)} />
          </View>
          <PaymentBreakdownCard
            deliveryFeePsw={selectedRow.deliveryFeePsw ?? 0}
            transitFeePsw={selectedRow.plannedToBePaidPsw ?? 0}
            senderPaidTransit={false}
          />
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  sectionTitle: { ...mobileTextStyles.headline },
  listWrap: { gap: mobileSpacing.sm + 2 },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
});
