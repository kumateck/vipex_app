import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  getRiderBranchBenchmark,
  listRiderParcels,
  riderGivenToCustomer,
  riderReturnedToOffice,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { RiderBenchmarkResponse, RiderDoorstepRecord } from '@mobile/types/parcels';
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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.max(0, value).toFixed(1)}%`;
}

function formatDelta(value: number, inverseGood = false) {
  const sign = value > 0 ? '+' : '';
  const tone = inverseGood ? (value <= 0 ? 'Good' : 'Needs focus') : value >= 0 ? 'Good' : 'Below';
  return `${sign}${value.toFixed(1)}% (${tone})`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
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
  const [benchmark, setBenchmark] = useState<RiderBenchmarkResponse | null>(null);

  async function load() {
    if (!riderUserId) return;
    setRefreshing(true);
    try {
      const [current, history, benchmarkResult] = await withAuth(async (token) => {
        const [currentRowsResult, historyRowsResult, benchmarkResult] = await Promise.all([
          listRiderParcels(token, riderUserId, 'current'),
          listRiderParcels(token, riderUserId, 'history'),
          session.user?.branchId
            ? getRiderBranchBenchmark(token, {
                riderUserId,
                branchId: session.user.branchId,
              })
            : Promise.resolve(null),
        ]);
        return [currentRowsResult, historyRowsResult, benchmarkResult] as const;
      });
      setCurrentRows(current.rows ?? []);
      setHistoryRows(history.rows ?? []);
      setBenchmark(benchmarkResult);
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load rider parcels',
      );
      void hapticError();
      setBenchmark(null);
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

  const riderRoleLabel = session.user?.role?.name?.trim() || 'Rider';

  const analytics = useMemo(() => {
    const completed = historyRows.length;
    const outstanding = currentRows.length;
    const totalKnown = completed + outstanding;
    const completionRate = totalKnown > 0 ? (completed / totalKnown) * 100 : 0;

    const returnedCount = historyRows.filter((row) => {
      const status = (row.deliveryStatus ?? '').toString().toLowerCase();
      return status.includes('return');
    }).length;
    const returnRate = completed > 0 ? (returnedCount / completed) * 100 : 0;

    const totalPaidPsw = historyRows.reduce((sum, row) => sum + (row.amountPaidPsw ?? 0), 0);
    const averagePaidPsw = completed > 0 ? totalPaidPsw / completed : 0;

    const now = new Date();
    const todayKey = startOfDay(now);
    const dailySeries: Array<{ dayLabel: string; completed: number; created: number }> = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - offset);
      const key = startOfDay(day);
      const dayLabel = day.toLocaleDateString([], { weekday: 'short' });

      const completedForDay = historyRows.filter((row) => {
        if (!row.updatedAt) return false;
        const parsed = new Date(row.updatedAt);
        if (Number.isNaN(parsed.getTime())) return false;
        return startOfDay(parsed) === key;
      }).length;

      const createdForDay = currentRows.filter((row) => {
        const sourceDate = row.createdAt ?? row.updatedAt;
        if (!sourceDate) return false;
        const parsed = new Date(sourceDate);
        if (Number.isNaN(parsed.getTime())) return false;
        return startOfDay(parsed) === key;
      }).length;

      dailySeries.push({
        dayLabel,
        completed: completedForDay,
        created: createdForDay,
      });
    }

    const todayCompleted = dailySeries[dailySeries.length - 1]?.completed ?? 0;
    const yesterdayCompleted = dailySeries[dailySeries.length - 2]?.completed ?? 0;
    const todayDelta =
      yesterdayCompleted > 0
        ? ((todayCompleted - yesterdayCompleted) / yesterdayCompleted) * 100
        : 0;

    const unresolvedOlderThanOneDay = currentRows.filter((row) => {
      const sourceDate = row.createdAt ?? row.updatedAt;
      if (!sourceDate) return false;
      const parsed = new Date(sourceDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return todayKey - startOfDay(parsed) >= 24 * 60 * 60 * 1000;
    }).length;

    return {
      completionRate,
      returnRate,
      averagePaidPsw,
      todayDelta,
      unresolvedOlderThanOneDay,
      dailySeries,
    };
  }, [currentRows, historyRows]);

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
        Rider Analytics ({riderRoleLabel})
      </Text>
      <View style={styles.kpiGrid}>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Completion Rate (All Known)
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {formatPercent(analytics.completionRate)}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>Return Rate</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {formatPercent(analytics.returnRate)}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Avg Payment Per Delivered
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {formatCedisFromPsw(analytics.averagePaidPsw)}
          </Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Outstanding &gt; 24h
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {analytics.unresolvedOlderThanOneDay}
          </Text>
        </View>
      </View>

      <AppCard>
        <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
          7-Day Throughput Trend
        </Text>
        <Text style={[styles.detailsLine, { color: theme.colors.textSubtle }]}>
          Today vs yesterday completed delta: {formatPercent(analytics.todayDelta)}
        </Text>
        {analytics.dailySeries.map((point) => (
          <View key={point.dayLabel} style={styles.trendRow}>
            <Text style={[styles.trendDay, { color: theme.colors.textMuted }]}>
              {point.dayLabel}
            </Text>
            <Text style={[styles.trendValue, { color: theme.colors.text }]}>
              Completed: {point.completed}
            </Text>
            <Text style={[styles.trendValue, { color: theme.colors.textSubtle }]}>
              New Assigned: {point.created}
            </Text>
          </View>
        ))}
      </AppCard>

      {benchmark ? (
        <AppCard>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Branch Benchmark</Text>
          <Text style={[styles.detailsLine, { color: theme.colors.textSubtle }]}>
            Compared with {benchmark.branch.ridersCount} riders in your branch.
          </Text>
          <View style={styles.benchmarkRow}>
            <Text style={[styles.benchmarkLabel, { color: theme.colors.textMuted }]}>
              Completion Rate
            </Text>
            <Text style={[styles.benchmarkValue, { color: theme.colors.text }]}>
              {formatPercent(benchmark.rider.completionRate)} vs{' '}
              {formatPercent(benchmark.branchAverage.completionRate)}
            </Text>
            <Text style={[styles.benchmarkDelta, { color: theme.colors.textSubtle }]}>
              {formatDelta(benchmark.rider.completionRate - benchmark.branchAverage.completionRate)}
            </Text>
          </View>
          <View style={styles.benchmarkRow}>
            <Text style={[styles.benchmarkLabel, { color: theme.colors.textMuted }]}>
              Return Rate
            </Text>
            <Text style={[styles.benchmarkValue, { color: theme.colors.text }]}>
              {formatPercent(benchmark.rider.returnRate)} vs{' '}
              {formatPercent(benchmark.branchAverage.returnRate)}
            </Text>
            <Text style={[styles.benchmarkDelta, { color: theme.colors.textSubtle }]}>
              {formatDelta(benchmark.rider.returnRate - benchmark.branchAverage.returnRate, true)}
            </Text>
          </View>
          <View style={styles.benchmarkRow}>
            <Text style={[styles.benchmarkLabel, { color: theme.colors.textMuted }]}>
              Avg Paid Per Delivery
            </Text>
            <Text style={[styles.benchmarkValue, { color: theme.colors.text }]}>
              {formatCedisFromPsw(benchmark.rider.averagePaidPsw)} vs{' '}
              {formatCedisFromPsw(benchmark.branchAverage.averagePaidPsw)}
            </Text>
          </View>
          <View style={styles.benchmarkRow}>
            <Text style={[styles.benchmarkLabel, { color: theme.colors.textMuted }]}>
              Outstanding &gt; 24h
            </Text>
            <Text style={[styles.benchmarkValue, { color: theme.colors.text }]}>
              {benchmark.rider.unresolvedOlderThanOneDay.toFixed(1)} vs{' '}
              {benchmark.branchAverage.unresolvedOlderThanOneDay.toFixed(1)}
            </Text>
          </View>
        </AppCard>
      ) : null}

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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  trendDay: { width: 48, fontWeight: '700' },
  trendValue: { flex: 1, fontSize: mobileTypography.caption },
  benchmarkRow: { gap: 4, marginTop: mobileSpacing.xs },
  benchmarkLabel: { fontSize: mobileTypography.caption, fontWeight: '700' },
  benchmarkValue: { fontWeight: '700' },
  benchmarkDelta: { fontSize: mobileTypography.caption },
});
