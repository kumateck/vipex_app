import { StyleSheet, Text, View } from 'react-native';
import { AppSkeletonCard } from '@mobile/components/ui';
import { ParcelCard } from '@mobile/components/courier';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { QueueEmptyState } from './queue-empty-state';

type QueueResultsSectionProps = {
  canSearch: boolean;
  hasSearch: boolean;
  loading: boolean;
  rows: ParcelSearchRow[];
  onSelect: (parcel: ParcelSearchRow) => void;
};

export function QueueResultsSection(props: QueueResultsSectionProps) {
  const { theme } = useAppearance();
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Search results</Text>
        {props.hasSearch && !props.loading ? (
          <Text style={[styles.count, { color: theme.colors.textSubtle }]}>
            {props.rows.length}
          </Text>
        ) : null}
      </View>
      {!props.canSearch ? (
        <QueueEmptyState
          icon="lock-closed-outline"
          message="You do not have permission to view parcel search results."
        />
      ) : props.loading ? (
        <View style={styles.list}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : !props.hasSearch ? (
        <QueueEmptyState
          icon="search-outline"
          message="Enter a booking code, customer name, or phone number to begin."
        />
      ) : props.rows.length === 0 ? (
        <QueueEmptyState
          icon="file-tray-outline"
          message="No matching parcels were found. Try another search term."
        />
      ) : (
        <View style={styles.list}>
          {props.rows.map((parcel) => (
            <ParcelCard
              key={parcel.id}
              parcel={parcel}
              onPress={() => props.onSelect(parcel)}
              actionLabel="View details"
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: mobileSpacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...mobileTextStyles.title3 },
  count: { ...mobileTextStyles.footnote, fontWeight: '700' },
  list: { gap: mobileSpacing.sm + 2 },
});
