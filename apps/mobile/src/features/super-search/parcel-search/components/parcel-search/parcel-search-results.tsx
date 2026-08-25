import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppSkeletonCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { ParcelSearchResultCard } from './parcel-search-result-card';

type Props = {
  busy: boolean;
  searched: boolean;
  rows: ParcelSearchRow[];
  onOpen: (parcel: ParcelSearchRow) => void;
};

function SearchEmptyState({ searched }: { searched: boolean }) {
  const { theme } = useAppearance();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
        <Ionicons
          name={searched ? 'file-tray-outline' : 'search-outline'}
          size={27}
          color={theme.colors.secondary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {searched ? 'No matching parcels' : 'Ready when you are'}
      </Text>
      <Text style={[styles.emptyCopy, { color: theme.colors.textMuted }]}>
        {searched
          ? 'Try another booking code, customer name, or phone number.'
          : 'Enter any parcel detail above to find its latest record.'}
      </Text>
    </View>
  );
}

export function ParcelSearchResults({ busy, searched, rows, onOpen }: Props) {
  const { theme } = useAppearance();
  if (busy) {
    return (
      <View style={styles.list}>
        <AppSkeletonCard lines={4} />
        <AppSkeletonCard lines={4} />
      </View>
    );
  }
  if (rows.length === 0) return <SearchEmptyState searched={searched} />;

  return (
    <View style={styles.list}>
      <View style={styles.resultsHeader}>
        <View>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Search results</Text>
          <Text style={[styles.resultsCopy, { color: theme.colors.textMuted }]}>
            Tap a parcel to see its full activity.
          </Text>
        </View>
        <View style={[styles.count, { backgroundColor: `${theme.colors.primary}16` }]}>
          <Text style={[styles.countText, { color: theme.colors.primary }]}>{rows.length}</Text>
        </View>
      </View>
      {rows.map((parcel) => (
        <ParcelSearchResultCard key={parcel.id} parcel={parcel} onPress={() => onOpen(parcel)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: mobileSpacing.md },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsTitle: { ...mobileTextStyles.title3 },
  resultsCopy: { ...mobileTextStyles.caption1 },
  count: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...mobileTextStyles.headline },
  empty: {
    alignItems: 'center',
    paddingHorizontal: mobileSpacing.xl,
    paddingVertical: mobileSpacing.xxl,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: mobileRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...mobileTextStyles.title3, marginTop: mobileSpacing.md },
  emptyCopy: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.xs },
});
