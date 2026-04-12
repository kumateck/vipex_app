import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { listRiderParcels, riderGivenToCustomer, riderReturnedToOffice } from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canCompleteRiderDeliveryActions, canViewRiderScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap } from '@mobile/lib/haptics';
import { ParcelCard, PaymentBreakdownCard, StatCard } from '@mobile/components/courier';
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@mobile/components/ui';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

function formatCedisFromPsw(amountPsw?: number) {
  const cedis = (amountPsw ?? 0) / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
}

function toDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayDateKey() {
  return toDateKey(new Date().toISOString()) ?? '';
}

function shiftDateKey(dateKey: string, diff: number) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  parsed.setDate(parsed.getDate() + diff);
  return toDateKey(parsed.toISOString()) ?? dateKey;
}

function isReturnedStatus(status?: string | null) {
  const normalized = (status ?? '').toLowerCase();
  return normalized.includes('return');
}

function isCompletedStatus(status?: string | null) {
  const normalized = (status ?? '').toLowerCase();
  if (isReturnedStatus(normalized)) return false;
  return (
    normalized.includes('deliver') ||
    normalized.includes('given') ||
    normalized.includes('success') ||
    normalized.includes('complete')
  );
}

function doorstepToParcelRow(row: RiderDoorstepRecord) {
  return {
    bookingCode: row.bookingCode,
    parcelDetails: row.parcelDetails,
    receiverName: row.receiverName ?? null,
    receiverPhone: row.receiverPhone ?? null,
    senderName: null,
    senderPhone: null,
    status: row.deliveryStatus,
    isDeleted: false,
  };
}

export default function RiderScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewRiderScreen(permissions);
  const canCompleteDelivery = canCompleteRiderDeliveryActions(permissions);
  const riderUserId = session.user?.sub;

  const [currentRows, setCurrentRows] = useState<RiderDoorstepRecord[]>([]);
  const [historyRows, setHistoryRows] = useState<RiderDoorstepRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionParcelId, setActionParcelId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'given' | 'returned' | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [activeSection, setActiveSection] = useState<'assigned' | 'history'>('assigned');

  async function load() {
    if (!riderUserId) return;
    setRefreshing(true);
    try {
      const [current, history] = await withAuth((token) =>
        Promise.all([
          listRiderParcels(token, riderUserId, 'current'),
          listRiderParcels(token, riderUserId, 'history'),
        ]),
      );
      setCurrentRows(current.rows ?? []);
      setHistoryRows(history.rows ?? []);
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load rider parcels',
      );
      void hapticError();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, [riderUserId]);

  const currentParcelIdSet = useMemo(
    () => new Set(currentRows.map((row) => row.parcelId)),
    [currentRows],
  );

  const assignedForDay = useMemo(() => {
    return currentRows.filter((row) => toDateKey(row.createdAt ?? row.updatedAt) === selectedDate);
  }, [currentRows, selectedDate]);

  const historyForDay = useMemo(() => {
    return historyRows.filter((row) => toDateKey(row.updatedAt ?? row.createdAt) === selectedDate);
  }, [historyRows, selectedDate]);

  const completedForDay = useMemo(
    () => historyForDay.filter((row) => isCompletedStatus(row.deliveryStatus)),
    [historyForDay],
  );

  const returnedForDay = useMemo(
    () => historyForDay.filter((row) => isReturnedStatus(row.deliveryStatus)),
    [historyForDay],
  );

  const totalAmountReceivedPsw = useMemo(
    () => completedForDay.reduce((sum, row) => sum + (row.amountPaidPsw ?? 0), 0),
    [completedForDay],
  );

  const totalDeliveryFeePsw = useMemo(
    () => completedForDay.reduce((sum, row) => sum + (row.deliveryFeePsw ?? 0), 0),
    [completedForDay],
  );

  const totalToBePaidPsw = useMemo(
    () => completedForDay.reduce((sum, row) => sum + (row.plannedToBePaidPsw ?? 0), 0),
    [completedForDay],
  );

  const historyListByDate = useMemo(() => {
    return historyRows.filter(
      (row) =>
        isCompletedStatus(row.deliveryStatus) &&
        toDateKey(row.updatedAt ?? row.createdAt) === selectedDate,
    );
  }, [historyRows, selectedDate]);

  const assignedList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentRows;
    return currentRows.filter((row) => {
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
  }, [currentRows, search]);

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

  const visibleList = activeSection === 'assigned' ? assignedList : historyList;

  return (
    <AppScreen refreshing={refreshing} onRefresh={() => void load()}>
      <AppPageHeader title="My Deliveries" subtitle={`Assigned and history for ${selectedDate}`} />

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date Picker</Text>
        <Text style={{ color: theme.colors.textSubtle }}>Filter date (default today).</Text>
        <AppInput
          value={selectedDate}
          onChangeText={(value) => setSelectedDate(value.trim())}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <AppButton
            title="Previous"
            variant="secondary"
            onPress={() => setSelectedDate((prev) => shiftDateKey(prev, -1))}
          />
          <AppButton
            title="Today"
            variant="secondary"
            onPress={() => setSelectedDate(todayDateKey())}
          />
          <AppButton
            title="Next"
            variant="secondary"
            onPress={() => setSelectedDate((prev) => shiftDateKey(prev, 1))}
          />
        </View>
      </AppCard>

      <View style={styles.kpiGrid}>
        <StatCard label="Total Assigned" value={assignedForDay.length} />
        <StatCard label="Total Completed Delivery" value={completedForDay.length} />
        <StatCard label="Total Return To Office" value={returnedForDay.length} />
        <StatCard
          label="Total Amount Received"
          value={formatCedisFromPsw(totalAmountReceivedPsw)}
        />
      </View>

      <PaymentBreakdownCard
        deliveryFeePsw={totalDeliveryFeePsw}
        transitFeePsw={totalToBePaidPsw}
        senderPaidTransit={false}
      />

      <View style={styles.switchRow}>
        <AppButton
          title="Assigned"
          onPress={() => setActiveSection('assigned')}
          variant={activeSection === 'assigned' ? 'primary' : 'secondary'}
        />
        <AppButton
          title="History"
          onPress={() => setActiveSection('history')}
          variant={activeSection === 'history' ? 'primary' : 'secondary'}
        />
      </View>

      <AppInput
        value={search}
        onChangeText={setSearch}
        placeholder={
          activeSection === 'assigned' ? 'Search assigned parcels...' : 'Search history by date...'
        }
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {activeSection === 'assigned' ? 'Assigned Parcels' : `History (${selectedDate})`}
      </Text>

      {refreshing ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : visibleList.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          {activeSection === 'assigned'
            ? 'No assigned parcels found.'
            : 'No successful delivery history for this date.'}
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {visibleList.map((item) => (
            <ParcelCard
              key={`${activeSection}-${item.parcelId}`}
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
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            Details: {selectedRow.parcelDetails}
          </Text>

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
          {!canCompleteDelivery ? (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              You do not have permission to complete rider delivery actions.
            </Text>
          ) : null}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: mobileTypography.sectionTitle,
    fontWeight: '700',
  },
  kpiGrid: { gap: mobileSpacing.sm, flexDirection: 'row', flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2 },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
  meta: { lineHeight: 19 },
});
