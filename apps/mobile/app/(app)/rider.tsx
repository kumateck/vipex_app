import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { listRiderParcels, riderGivenToCustomer, riderReturnedToOffice } from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canCompleteRiderDeliveryActions, canViewRiderScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticTap } from '@mobile/lib/haptics';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  AppStatusChip,
  MobileNoAccess,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

function isSameCalendarDay(dateLike?: string) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatCedisFromPsw(amountPsw?: number) {
  const cedis = (amountPsw ?? 0) / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
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

  async function load() {
    if (!riderUserId) return;
    setRefreshing(true);
    try {
      const [current, history] = await withAuth(async (token) => {
        return Promise.all([
          listRiderParcels(token, riderUserId, 'current'),
          listRiderParcels(token, riderUserId, 'history'),
        ]);
      });
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

  const pendingTodayRows = useMemo(() => {
    return currentRows.filter((row) => isSameCalendarDay(row.createdAt ?? row.updatedAt));
  }, [currentRows]);

  const successfulDeliveriesToday = useMemo(() => {
    return historyRows.filter((row) => isSameCalendarDay(row.updatedAt)).length;
  }, [historyRows]);

  const totalDeliveriesToday = useMemo(() => {
    return pendingTodayRows.length + successfulDeliveriesToday;
  }, [pendingTodayRows.length, successfulDeliveriesToday]);

  const outstandingDeliveries = currentRows.length;

  const successfulPaymentReceivedTodayPsw = useMemo(() => {
    return historyRows
      .filter((row) => isSameCalendarDay(row.updatedAt))
      .reduce((sum, row) => sum + (row.amountPaidPsw ?? 0), 0);
  }, [historyRows]);

  const searchableRows = useMemo(() => {
    const byParcelId = new Map<string, RiderDoorstepRecord>();
    for (const row of [...currentRows, ...historyRows]) {
      if (!byParcelId.has(row.parcelId)) {
        byParcelId.set(row.parcelId, row);
      }
    }
    return Array.from(byParcelId.values());
  }, [currentRows, historyRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return searchableRows;
    return searchableRows.filter((row) => {
      const haystack = [
        row.trackingCode,
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
  }, [search, searchableRows]);

  const selectedRow = useMemo(() => {
    if (!selectedParcelId) return null;
    return searchableRows.find((row) => row.parcelId === selectedParcelId) ?? null;
  }, [searchableRows, selectedParcelId]);

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
      <Text style={[styles.title, { color: theme.colors.text }]}>Rider Operations</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Track today’s delivery performance and complete parcel actions quickly.
      </Text>
      <AppButton
        title={refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
        onPress={() => void load()}
        variant="secondary"
        disabled={refreshing}
      />

      <View style={styles.kpiGrid}>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Successful Payment (Today)
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {formatCedisFromPsw(successfulPaymentReceivedTodayPsw)}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Successful Deliveries (Today)
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {successfulDeliveriesToday}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Total Deliveries (Today)
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {totalDeliveriesToday}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Outstanding Deliveries
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {outstandingDeliveries}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
        Parcels Yet To Deliver Today
      </Text>
      {refreshing ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : (
        <FlatList
          data={pendingTodayRows}
          keyExtractor={(item) => item.parcelId}
          contentContainerStyle={{ gap: 10, paddingTop: 8 }}
          renderItem={({ item }) => (
            <AppCard>
              <Text style={[styles.bold, { color: theme.colors.text }]}>{item.trackingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <AppStatusChip label={item.deliveryStatus} />
              <Text style={{ color: theme.colors.textSubtle }}>
                Address: {item.dropoffAddress ?? '-'}
              </Text>
              <AppButton
                title="Open Parcel"
                onPress={() => {
                  setSelectedParcelId(item.parcelId);
                  void hapticTap();
                }}
                variant="secondary"
              />
            </AppCard>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              No pending deliveries for today.
            </Text>
          }
        />
      )}

      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Find Any Parcel</Text>
      <AppInput
        value={search}
        onChangeText={setSearch}
        placeholder="Tracking / Booking / Receiver / Phone"
      />
      {refreshing ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : (
        <FlatList
          data={filteredRows.slice(0, 20)}
          keyExtractor={(item) => `${item.parcelId}-search`}
          contentContainerStyle={{ gap: 10, paddingTop: 8 }}
          renderItem={({ item }) => (
            <AppCard>
              <Text style={[styles.bold, { color: theme.colors.text }]}>{item.trackingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.bookingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
              </Text>
              <AppStatusChip label={item.deliveryStatus} />
              <AppButton
                title="Open Parcel"
                onPress={() => {
                  setSelectedParcelId(item.parcelId);
                  void hapticTap();
                }}
                variant="secondary"
              />
            </AppCard>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              No parcels match your search.
            </Text>
          }
        />
      )}

      {selectedRow ? (
        <AppCard>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Parcel Details</Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Tracking: {selectedRow.trackingCode}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Booking: {selectedRow.bookingCode}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Receiver: {selectedRow.receiverName ?? '-'}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Phone: {selectedRow.receiverPhone ?? '-'}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Address: {selectedRow.dropoffAddress ?? '-'}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Status: {selectedRow.deliveryStatus}
          </Text>
          <AppStatusChip label={selectedRow.deliveryStatus} />
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Amount Paid: {formatCedisFromPsw(selectedRow.amountPaidPsw)}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            Delivery Fee: {formatCedisFromPsw(selectedRow.deliveryFeePsw)}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
            To Be Paid: {formatCedisFromPsw(selectedRow.plannedToBePaidPsw)}
          </Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textMuted }]}>
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
          ) : (
            <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
              This parcel is not currently outstanding for rider action.
            </Text>
          )}
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
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, marginBottom: mobileSpacing.xs, lineHeight: 20 },
  sectionTitle: {
    fontSize: mobileTypography.sectionTitle,
    fontWeight: '700',
    marginTop: mobileSpacing.sm,
  },
  kpiGrid: { gap: mobileSpacing.sm, flexDirection: 'row', flexWrap: 'wrap' },
  kpiTile: { width: '48%', borderWidth: 1, borderRadius: 16, padding: mobileSpacing.md },
  kpiLabel: { fontSize: mobileTypography.caption },
  kpiValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  detailsTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  detailsLine: {},
  bold: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2, paddingTop: mobileSpacing.sm },
});
