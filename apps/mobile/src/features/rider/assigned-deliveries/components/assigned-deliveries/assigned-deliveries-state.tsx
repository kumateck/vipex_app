import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard, AppSkeletonCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function AssignedDeliveriesLoading() {
  return (
    <View style={styles.loading}>
      <AppSkeletonCard lines={5} />
      <AppSkeletonCard lines={5} />
    </View>
  );
}

export function AssignedDeliveriesEmpty(props: {
  filtered: boolean;
  onReset: () => void;
  onRefresh: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.secondary}14` }]}>
          <Ionicons
            name={props.filtered ? 'search-outline' : 'checkmark-done-outline'}
            size={30}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {props.filtered ? 'No matching delivery' : 'Your route is clear'}
          </Text>
          <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
            {props.filtered
              ? 'Try another booking code, receiver or address.'
              : 'New parcels assigned to you will appear here automatically.'}
          </Text>
        </View>
        <AppButton
          title={props.filtered ? 'Clear search' : 'Check for assignments'}
          variant="tinted"
          onPress={props.filtered ? props.onReset : props.onRefresh}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  loading: { gap: mobileSpacing.md },
  empty: { alignItems: 'center', gap: mobileSpacing.md, paddingVertical: mobileSpacing.md },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: mobileRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: { alignItems: 'center', gap: 4 },
  emptyTitle: { ...mobileTextStyles.title3, fontWeight: '700', textAlign: 'center' },
  emptyBody: { ...mobileTextStyles.subhead, textAlign: 'center', maxWidth: 280 },
});
