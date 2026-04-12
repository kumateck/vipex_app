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
import { ParcelCard, StatCard } from '@mobile/components/courier';
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSkeletonCard,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

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
      <AppPageHeader title="Super Track" subtitle="Search any parcel record quickly" />

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Search</Text>
        <AppInput value={query} onChangeText={setQuery} placeholder="Search..." />
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

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
        <View style={styles.kpiRow}>
          <StatCard label="Matched Records" value={rows.length} />
          <StatCard label="Deleted Included" value={totalDeleted} />
        </View>
      </AppCard>

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
            <ParcelCard
              key={row.id}
              parcel={row}
              onPress={() => {
                router.push({
                  pathname: '/super-search/[parcelId]' as never,
                  params: { parcelId: row.id },
                });
                void hapticTap();
              }}
              actionLabel="Open Record"
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  kpiRow: { flexDirection: 'row', gap: mobileSpacing.sm },
  listWrap: { gap: mobileSpacing.sm + 2 },
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
