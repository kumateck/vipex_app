import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { searchParcels } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { hapticError, hapticTap } from '@mobile/lib/haptics';
import { ParcelCard } from '@mobile/components/courier';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export default function SuperSearchScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [query, setQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [searched, setSearched] = useState(false);

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
          pageSize: 20,
        }),
      );
      setRows(response.data ?? []);
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
      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Search Parcels</Text>
        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Enter booking code, name, or phone"
        />
        <Text style={[styles.helperText, { color: theme.colors.textSubtle }]}>
          Includes active, void, and deleted records.
        </Text>
        <View style={styles.buttonRow}>
          <AppButton
            title={searchBusy ? 'Searching...' : 'Search Records'}
            onPress={() => void runSearch()}
            disabled={searchBusy || query.trim().length === 0 || !companyId}
          />
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
                  params: { parcelId: row.id, bookingCode: row.bookingCode },
                });
                void hapticTap();
              }}
              actionLabel="View Details"
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...mobileTextStyles.headline },
  helperText: { ...mobileTextStyles.caption1 },
  buttonRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm + 2 },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
});
