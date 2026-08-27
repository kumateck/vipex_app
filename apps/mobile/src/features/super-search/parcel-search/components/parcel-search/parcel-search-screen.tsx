import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppScreen } from '@mobile/components/screen';
import { MobileNoAccess } from '@mobile/components/ui';
import { canViewParcelSearch } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { mobileSpacing } from '@mobile/theme/layout';
import { useParcelSearch, useParcelSearchMotion } from '../../hooks';
import { ParcelSearchForm } from './parcel-search-form';
import { ParcelSearchHeader } from './parcel-search-header';
import { ParcelSearchResults } from './parcel-search-results';

export function ParcelSearchScreen() {
  const { session } = useAuth();
  const canView = canViewParcelSearch(session.user?.permissions);
  const search = useParcelSearch();
  const motion = useParcelSearchMotion(
    `${search.searchBusy}-${search.searched}-${search.rows.length}`,
  );

  if (!canView) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to search parcel records." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      style={styles.screen}
      refreshing={search.searchBusy}
      onRefresh={() => void search.runSearch()}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View style={motion.headerStyle}>
        <ParcelSearchHeader />
      </Animated.View>
      <Animated.View style={motion.formStyle}>
        <ParcelSearchForm
          query={search.query}
          busy={search.searchBusy}
          onChange={search.setQuery}
          onClear={search.clearSearch}
          onSubmit={() => void search.runSearch()}
        />
      </Animated.View>
      <Animated.View style={motion.resultsStyle}>
        <ParcelSearchResults
          busy={search.searchBusy}
          searched={search.searched}
          rows={search.rows}
          onOpen={search.openParcel}
        />
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: mobileSpacing.xxxl },
});
