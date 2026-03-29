import { useEffect, useMemo, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppScreen } from '@/components/screen';
import { listRiderParcels, riderGivenToCustomer, riderReturnedToOffice } from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { RiderDoorstepRecord } from '@/types/parcels';
import { useAuth } from '@/providers/auth-provider';

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
  const { session, withAuth } = useAuth();
  const riderUserId = session.user?.sub;

  const [currentRows, setCurrentRows] = useState<RiderDoorstepRecord[]>([]);
  const [historyRows, setHistoryRows] = useState<RiderDoorstepRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!riderUserId) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      await withAuth((token) =>
        riderGivenToCustomer(token, {
          parcelId,
          riderUserId,
          signatureImage: 'MOBILE_CONFIRMATION',
        }),
      );
      notifySuccess('Parcel marked as handed to customer.');
      await load();
      setSelectedParcelId(parcelId);
    } catch (err) {
      notifyError('Failed', err instanceof Error ? err.message : 'Unable to update parcel');
    }
  }

  async function markReturned(parcelId: string) {
    if (!riderUserId) return;
    try {
      await withAuth((token) => riderReturnedToOffice(token, { parcelId, riderUserId }));
      notifySuccess('Parcel marked as returned to office.');
      await load();
      setSelectedParcelId(parcelId);
    } catch (err) {
      notifyError('Failed', err instanceof Error ? err.message : 'Unable to update parcel');
    }
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Rider Operations</Text>
      <View style={styles.switcher}>
        <Button title={loading ? 'Loading...' : 'Refresh'} onPress={() => void load()} />
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Successful Payment (Today)</Text>
          <Text style={styles.kpiValue}>
            {formatCedisFromPsw(successfulPaymentReceivedTodayPsw)}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Successful Deliveries (Today)</Text>
          <Text style={styles.kpiValue}>{successfulDeliveriesToday}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Deliveries (Today)</Text>
          <Text style={styles.kpiValue}>{totalDeliveriesToday}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Outstanding Deliveries</Text>
          <Text style={styles.kpiValue}>{outstandingDeliveries}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Parcels Yet To Deliver Today</Text>
      <FlatList
        data={pendingTodayRows}
        keyExtractor={(item) => item.parcelId}
        contentContainerStyle={{ gap: 10, paddingTop: 8 }}
        renderItem={({ item }) => (
          <View
            style={[styles.card, selectedParcelId === item.parcelId ? styles.cardActive : null]}
          >
            <Text style={styles.bold}>{item.trackingCode}</Text>
            <Text>
              {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
            </Text>
            <Text>Status: {item.deliveryStatus}</Text>
            <Text>Address: {item.dropoffAddress ?? '-'}</Text>
            <Button title="View Details" onPress={() => setSelectedParcelId(item.parcelId)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending deliveries for today.</Text>}
      />

      <Text style={styles.sectionTitle}>Search Parcel (View + Process)</Text>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Tracking / Booking / Receiver / Phone"
      />
      <FlatList
        data={filteredRows.slice(0, 20)}
        keyExtractor={(item) => `${item.parcelId}-search`}
        contentContainerStyle={{ gap: 10, paddingTop: 8 }}
        renderItem={({ item }) => (
          <View
            style={[styles.card, selectedParcelId === item.parcelId ? styles.cardActive : null]}
          >
            <Text style={styles.bold}>{item.trackingCode}</Text>
            <Text>{item.bookingCode}</Text>
            <Text>
              {item.receiverName ?? '-'} ({item.receiverPhone ?? '-'})
            </Text>
            <Text>Status: {item.deliveryStatus}</Text>
            <Button title="View Details" onPress={() => setSelectedParcelId(item.parcelId)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No parcels match your search.</Text>}
      />

      {selectedRow ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Parcel Details</Text>
          <Text style={styles.detailsLine}>Tracking: {selectedRow.trackingCode}</Text>
          <Text style={styles.detailsLine}>Booking: {selectedRow.bookingCode}</Text>
          <Text style={styles.detailsLine}>Receiver: {selectedRow.receiverName ?? '-'}</Text>
          <Text style={styles.detailsLine}>Phone: {selectedRow.receiverPhone ?? '-'}</Text>
          <Text style={styles.detailsLine}>Address: {selectedRow.dropoffAddress ?? '-'}</Text>
          <Text style={styles.detailsLine}>Status: {selectedRow.deliveryStatus}</Text>
          <Text style={styles.detailsLine}>
            Amount Paid: {formatCedisFromPsw(selectedRow.amountPaidPsw)}
          </Text>
          <Text style={styles.detailsLine}>
            Delivery Fee: {formatCedisFromPsw(selectedRow.deliveryFeePsw)}
          </Text>
          <Text style={styles.detailsLine}>
            To Be Paid: {formatCedisFromPsw(selectedRow.plannedToBePaidPsw)}
          </Text>
          <Text style={styles.detailsLine}>Details: {selectedRow.parcelDetails}</Text>

          {currentParcelIdSet.has(selectedRow.parcelId) ? (
            <View style={styles.switcher}>
              <Button title="Given" onPress={() => void markDelivered(selectedRow.parcelId)} />
              <Button title="Returned" onPress={() => void markReturned(selectedRow.parcelId)} />
            </View>
          ) : (
            <Text style={styles.empty}>
              This parcel is not currently outstanding for rider action.
            </Text>
          )}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  switcher: { flexDirection: 'row', gap: 8 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: { fontSize: 12, color: '#475467' },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  cardActive: {
    borderColor: '#175cd3',
    borderWidth: 1.5,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 6,
  },
  detailsTitle: { fontSize: 16, fontWeight: '700' },
  detailsLine: { color: '#344054' },
  bold: { fontWeight: '700' },
  empty: { color: '#667085', textAlign: 'center', marginTop: 18 },
});
