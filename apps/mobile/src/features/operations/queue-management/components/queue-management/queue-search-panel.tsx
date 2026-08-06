import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard, AppInput } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type QueueSearchPanelProps = {
  search: string;
  loading: boolean;
  loadingBoards: boolean;
  canSearch: boolean;
  onChangeSearch: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
};

export function QueueSearchPanel(props: QueueSearchPanelProps) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.titleRow}>
        <View style={[styles.icon, { backgroundColor: `${theme.colors.primary}18` }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Find a parcel</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            Search by booking code, customer, or phone
          </Text>
        </View>
      </View>
      <AppInput
        value={props.search}
        onChangeText={props.onChangeSearch}
        onSubmitEditing={props.onSearch}
        returnKeyType="search"
        autoCapitalize="none"
        placeholder="Booking code, name, or phone"
      />
      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <AppButton
            title={props.loading ? 'Searching…' : 'Search'}
            onPress={props.onSearch}
            disabled={!props.canSearch || props.loading || !props.search.trim()}
          />
        </View>
        <AppButton
          title={props.loadingBoards ? 'Refreshing…' : 'Refresh'}
          onPress={props.onRefresh}
          disabled={props.loadingBoards}
          variant="secondary"
        />
      </View>
      {!props.canSearch ? (
        <Text style={[styles.permission, { color: theme.colors.textSubtle }]}>
          Parcel search is unavailable for your current permissions.
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, gap: 1 },
  title: { ...mobileTextStyles.headline },
  subtitle: { ...mobileTextStyles.caption1 },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: mobileSpacing.sm },
  primaryAction: { flex: 1 },
  permission: { ...mobileTextStyles.caption1 },
});
