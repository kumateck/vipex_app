import { router, useLocalSearchParams } from 'expo-router';
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
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parcel Details</Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Booking: {selectedRow.bookingCode}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Receiver: {selectedRow.receiverName ?? '-'}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Phone: {selectedRow.receiverPhone ?? '-'}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Address: {selectedRow.dropoffAddress ?? '-'}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Status: {selectedRow.deliveryStatus}
          </Text>
          <AppStatusChip label={selectedRow.deliveryStatus} />
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Amount Paid: {formatCedisFromPsw(selectedRow.amountPaidPsw)}
          </Text>
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
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  listWrap: { gap: mobileSpacing.sm + 2 },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
  meta: { lineHeight: 19 },
});
