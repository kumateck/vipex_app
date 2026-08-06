import { router, useLocalSearchParams } from '@mobile/navigation/router-compat';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { ParcelCard, PaymentBreakdownCard } from '@mobile/components/courier';
import { riderGivenToCustomer, riderReturnedToOffice } from '@mobile/lib/api';
import { hapticError, hapticSuccess, hapticTap } from '@mobile/lib/haptics';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
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

export default function RiderAssignedScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof params.date === 'string' && params.date.trim() ? params.date : '';
  const [search, setSearch] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [actionParcelId, setActionParcelId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'given' | 'returned' | null>(null);
  const { withAuth } = useAuth();
  const { theme } = useAppearance();
  const {
    canView,
    canCompleteDelivery,
    riderUserId,
    currentRows,
    historyRows,
    refreshing,
    load,
    currentParcelIdSet,
  } = useRiderBoardData(initialDate);

  const assignedListByDate = useMemo(() => {
    if (!initialDate) return currentRows;
    return currentRows.filter((row) => toDateKey(row.createdAt ?? row.updatedAt) === initialDate);
  }, [currentRows, initialDate]);

  const assignedList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignedListByDate;
    return assignedListByDate.filter((row) => {
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
  }, [assignedListByDate, search]);

  const selectedRow = useMemo(() => {
    if (!selectedParcelId) return null;
    return (
      currentRows.find((row) => row.parcelId === selectedParcelId) ??
      historyRows.find((row) => row.parcelId === selectedParcelId) ??
      null
    );
  }, [currentRows, historyRows, selectedParcelId]);

  async function markDelivered(parcelId: string) {
    if (!riderUserId) return;
    try {
      setActionParcelId(parcelId);
      setActionType('given');
      await withAuth((token) =>
        riderGivenToCustomer(token, {
          parcelId,
          riderUserId,
          signatureImage: 'MOBILE_CONFIRMATION',
        }),
      );
      notifySuccess('Parcel marked as handed to customer.');
      void hapticSuccess();
      await load();
      setSelectedParcelId(parcelId);
    } catch (err) {
      notifyError('Failed', err instanceof Error ? err.message : 'Unable to update parcel');
      void hapticError();
    } finally {
      setActionParcelId(null);
      setActionType(null);
    }
  }

  async function markReturned(parcelId: string) {
    if (!riderUserId) return;
    try {
      setActionParcelId(parcelId);
      setActionType('returned');
      await withAuth((token) => riderReturnedToOffice(token, { parcelId, riderUserId }));
      notifySuccess('Parcel marked as returned to office.');
      void hapticSuccess();
      await load();
      setSelectedParcelId(parcelId);
    } catch (err) {
      notifyError('Failed', err instanceof Error ? err.message : 'Unable to update parcel');
      void hapticError();
    } finally {
      setActionParcelId(null);
      setActionType(null);
    }
  }

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access rider operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={() => void load()}>
      <AppPageHeader title="Assigned Deliveries" subtitle="Current rider assignments" />
      <AppButton
        title="Back to Rider Dashboard"
        variant="secondary"
        onPress={() => router.back()}
      />

      <AppInput value={search} onChangeText={setSearch} placeholder="Search assigned parcels..." />

      {refreshing ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : assignedList.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          No assigned parcels found.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {assignedList.map((item) => (
            <ParcelCard
              key={`assigned-${item.parcelId}`}
              parcel={doorstepToParcelRow(item)}
              onPress={() => {
                setSelectedParcelId(item.parcelId);
                void hapticTap();
              }}
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

          {currentParcelIdSet.has(selectedRow.parcelId) ? (
            <View style={styles.buttonRow}>
              <AppButton
                title={
                  actionParcelId === selectedRow.parcelId && actionType === 'returned'
                    ? 'Returning To Office...'
                    : 'Mark Returned To Office'
                }
                onPress={() => void markReturned(selectedRow.parcelId)}
                variant="secondary"
                disabled={actionParcelId === selectedRow.parcelId || !canCompleteDelivery}
              />
              <AppButton
                title={
                  actionParcelId === selectedRow.parcelId && actionType === 'given'
                    ? 'Marking Given...'
                    : 'Mark Given To Customer'
                }
                onPress={() => void markDelivered(selectedRow.parcelId)}
                disabled={actionParcelId === selectedRow.parcelId || !canCompleteDelivery}
              />
            </View>
          ) : null}
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
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
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
