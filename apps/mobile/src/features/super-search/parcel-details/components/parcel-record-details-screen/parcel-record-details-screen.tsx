import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from '@mobile/navigation/router-compat';
import { AppScreen } from '@mobile/components/screen';
import { AppCard, MobileNoAccess } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { canViewParcelSearch } from '@mobile/lib/permissions';
import { useParcelHistory, useParcelRecordDetails } from '../../hooks';
import { ParcelDetailsHeader } from '../parcel-details-header';
import { ParcelDetailTabs, type ParcelDetailTab } from '../parcel-detail-tabs';
import { ParcelTabContent } from './parcel-tab-content';

export function ParcelRecordDetailsScreen() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const canView = canViewParcelSearch(session.user?.permissions);
  const { parcelId, bookingCode } = useLocalSearchParams<{
    parcelId: string;
    bookingCode?: string;
  }>();
  const [tab, setTab] = useState<ParcelDetailTab>('overview');
  const { loading, details, row, relatedRows, loadError, load } = useParcelRecordDetails({
    parcelId: canView ? parcelId : undefined,
    companyId,
    withAuth,
  });
  const history = useParcelHistory({ parcelId: canView ? parcelId : undefined, withAuth });
  const branchNameById = useMemo(() => {
    const names = new Map<string, string>();
    for (const entry of relatedRows) {
      if (entry.sourceId && entry.sourceName) names.set(entry.sourceId, entry.sourceName);
      if (entry.destinationId && entry.destinationName) {
        names.set(entry.destinationId, entry.destinationName);
      }
    }
    return names;
  }, [relatedRows]);

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to view parcel records." />
      </AppScreen>
    );
  }

  if (loading) {
    return (
      <AppScreen>
        <ParcelDetailsHeader bookingCode={bookingCode} />
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
        <ParcelDetailsHeader bookingCode={bookingCode} />
        <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
          {loadError ? `Unable to load details: ${loadError}` : 'Record not found.'}
        </Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      refreshing={loading}
      onRefresh={() => {
        void load();
        void history.reload();
      }}
    >
      <ParcelDetailsHeader bookingCode={bookingCode ?? row?.bookingCode} />
      <ParcelDetailTabs value={tab} onChange={setTab} historyCount={history.events.length} />
      <ParcelTabContent
        tab={tab}
        details={details}
        row={row}
        relatedRows={relatedRows}
        branchNameById={branchNameById}
        history={history}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', marginTop: mobileSpacing.sm },
});
