import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { searchParcels } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { loadGlobalSearchHistory, pushGlobalSearchHistory } from '@mobile/lib/communication-local';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { hapticError, hapticTap } from '@mobile/lib/haptics';
import {
  AppButton,
  AppCard,
  AppInput,
  AppSkeletonCard,
  AppStatusChip,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

const PARCEL_STATUS_LABELS: Record<number, string> = {
  0: 'Created',
  1: 'Processed',
  2: 'In Transit',
  3: 'Arrived At Destination',
  4: 'Customer Contacted',
  5: 'Awaiting Pickup',
  6: 'Delivered By Office',
  7: 'Home Delivery Requested',
  8: 'Address Collected',
  9: 'Dispatched',
  10: 'Rider Given Parcel To Customer',
  11: 'Delivered At Home',
  12: 'Returned To Office',
  13: 'Returned To Sender',
  14: 'Cancelled',
};

export default function SuperSearchScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [query, setQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const totalDeleted = useMemo(() => rows.filter((row) => Boolean(row.isDeleted)).length, [rows]);

  useEffect(() => {
    void (async () => {
      setHistory(await loadGlobalSearchHistory());
    })();
  }, []);

  async function runSearch(value?: string) {
    const trimmed = (value ?? query).trim();
    if (!trimmed || !companyId) return;
    setSearchBusy(true);
    setSearched(true);
    try {
      const response = await withAuth((token) =>
        searchParcels(token, {
          search: trimmed,
          companyId,
          includeDeleted: true,
          page: 1,
          pageSize: 50,
        }),
      );
      setRows(response.data ?? []);
      await pushGlobalSearchHistory(trimmed);
      setHistory(await loadGlobalSearchHistory());
      void hapticTap();
    } catch (err) {
      notifyError(
        'Search failed',
        err instanceof Error ? err.message : 'Unable to run super search',
      );
      void hapticError();
    } finally {
      setSearchBusy(false);
    }
  }

  return (
    <AppScreen refreshing={searchBusy} onRefresh={() => void runSearch()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>All Records Super Search</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Search by tracking code, booking code, sender/receiver name, or phone.
      </Text>

      <AppCard>
        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tracking / Booking / Sender / Receiver / Phone"
        />
        <View style={styles.buttonRow}>
          <AppButton
            title={searchBusy ? 'Searching...' : 'Search Records'}
            onPress={() => void runSearch()}
            disabled={searchBusy || query.trim().length === 0 || !companyId}
          />
          <AppButton
            title="Clear"
            onPress={() => {
              setQuery('');
              setRows([]);
              setSearched(false);
            }}
            variant="secondary"
          />
        </View>
      </AppCard>

      {history.length ? (
        <AppCard>
          <Text style={[styles.historyTitle, { color: theme.colors.textMuted }]}>
            Recent Searches
          </Text>
          <View style={styles.historyWrap}>
            {history.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setQuery(item);
                  void runSearch(item);
                }}
                style={[styles.historyPill, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.text }}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>
      ) : null}

      <View style={styles.kpiRow}>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>Matched Records</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{rows.length}</Text>
        </View>
        <View
          style={[
            styles.kpiTile,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textSubtle }]}>
            Deleted Included
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{totalDeleted}</Text>
        </View>
      </View>

      {searchBusy ? (
        <View style={styles.listWrap}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          {searched ? 'No records match your search.' : 'Enter a term and tap Search Records.'}
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {rows.map((row) => (
            <AppCard key={row.id}>
              <Text style={[styles.bold, { color: theme.colors.text }]}>{row.trackingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{row.bookingCode}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                Sender: {row.senderName ?? '-'} ({row.senderPhone ?? '-'})
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                Receiver: {row.receiverName ?? '-'} ({row.receiverPhone ?? '-'})
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>{row.parcelDetails}</Text>
              <AppStatusChip label={PARCEL_STATUS_LABELS[row.status] ?? row.status} />
              {row.isDeleted ? (
                <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
                  Deleted Record
                </Text>
              ) : null}
              <AppButton
                title="Open Record"
                onPress={() => {
                  router.push({
                    pathname: '/super-search/[parcelId]' as never,
                    params: { parcelId: row.id },
                  });
                  void hapticTap();
                }}
                variant="secondary"
              />
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  kpiTile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: mobileSpacing.md },
  kpiLabel: { fontSize: mobileTypography.caption, fontWeight: '600' },
  kpiValue: { fontSize: mobileTypography.kpi, fontWeight: '800', marginTop: 2 },
  listWrap: { gap: mobileSpacing.sm + 2 },
  bold: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
  historyTitle: { fontSize: mobileTypography.caption, fontWeight: '700' },
  historyWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
