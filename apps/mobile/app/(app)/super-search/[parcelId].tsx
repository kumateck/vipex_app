import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@mobile/components/screen';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  ParcelFinancialSections,
  ParcelHistorySections,
  ParcelSummarySections,
  useParcelRecordDetails,
} from '@mobile/features/super-search/parcel-details';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export default function SuperSearchRecordDetailsScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const { loading, details, row, relatedRows, loadError, load } = useParcelRecordDetails({
    parcelId,
    companyId,
    withAuth,
  });

  if (loading) {
    return (
      <AppScreen>
        <AppCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={{ color: theme.colors.textSubtle }}>Loading record details...</Text>
          </View>
        </AppCard>
      </AppScreen>
    );
  }

  if (!details) {
    return (
      <AppScreen>
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          {loadError ? `Unable to load details: ${loadError}` : 'Record not found.'}
        </Text>
      </AppScreen>
    );
  }

  const branchNameById = new Map<string, string>();
  for (const entry of relatedRows) {
    if (entry.sourceId && entry.sourceName) branchNameById.set(entry.sourceId, entry.sourceName);
    if (entry.destinationId && entry.destinationName) {
      branchNameById.set(entry.destinationId, entry.destinationName);
    }
  }

  return (
    <AppScreen refreshing={loading} onRefresh={() => void load()}>
      <ParcelSummarySections details={details} row={row} />
      <ParcelFinancialSections details={details} />
      <ParcelHistorySections
        details={details}
        relatedRows={relatedRows}
        branchNameById={branchNameById}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
});
