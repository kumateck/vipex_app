import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppStatusChip } from '@mobile/components/ui/mobile';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { ParcelSearchRow } from '@mobile/types/parcels';

export function ParcelSearchResultCard({
  parcel,
  onPress,
}: {
  parcel: ParcelSearchRow;
  onPress: () => void;
}) {
  const { theme } = useAppearance();
  const cancelled = parcel.status === ParcelStatus.CANCELLED;
  const route = `${parcel.sourceName ?? 'Source'} → ${parcel.destinationName ?? 'Destination'}`;

  return (
    <View style={[styles.card, mobileShadow.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.topRow}>
        <View style={styles.bookingWrap}>
          <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>BOOKING</Text>
          <Text numberOfLines={1} style={[styles.booking, { color: theme.colors.text }]}>
            {parcel.bookingCode}
          </Text>
        </View>
        <AppStatusChip label={parcel.status} />
      </View>

      <View style={[styles.route, { backgroundColor: theme.colors.cardMuted }]}>
        <Ionicons name="navigate-outline" size={16} color={theme.colors.secondary} />
        <Text numberOfLines={2} style={[styles.routeText, { color: theme.colors.text }]}>
          {route}
        </Text>
      </View>

      <View style={styles.personRow}>
        <Ionicons name="arrow-up-circle-outline" size={18} color={theme.colors.primary} />
        <View style={styles.personCopy}>
          <Text style={[styles.personLabel, { color: theme.colors.textSubtle }]}>Sender</Text>
          <Text numberOfLines={1} style={[styles.personName, { color: theme.colors.text }]}>
            {parcel.senderName ?? '—'}
          </Text>
        </View>
        <Text style={[styles.phone, { color: theme.colors.textMuted }]}>
          {parcel.senderPhone ?? '—'}
        </Text>
      </View>
      <View style={styles.personRow}>
        <Ionicons name="arrow-down-circle-outline" size={18} color={theme.colors.secondary} />
        <View style={styles.personCopy}>
          <Text style={[styles.personLabel, { color: theme.colors.textSubtle }]}>Receiver</Text>
          <Text numberOfLines={1} style={[styles.personName, { color: theme.colors.text }]}>
            {parcel.receiverName ?? '—'}
          </Text>
        </View>
        <Text style={[styles.phone, { color: theme.colors.textMuted }]}>
          {parcel.receiverPhone ?? '—'}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="cube-outline" size={16} color={theme.colors.textSubtle} />
        <Text numberOfLines={2} style={[styles.meta, { color: theme.colors.textMuted }]}>
          {parcel.parcelDetails || 'No parcel description'}
        </Text>
        {cancelled || parcel.isDeleted ? (
          <Text style={[styles.alert, { color: theme.colors.danger }]}>
            {parcel.isDeleted ? 'Deleted' : 'Void'}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${parcel.bookingCode}`}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: `${theme.colors.secondary}16`, opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <Text style={[styles.actionText, { color: theme.colors.secondary }]}>View details</Text>
        <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary }]}>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.secondaryText} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: mobileRadius.xl, padding: mobileSpacing.lg, gap: mobileSpacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  bookingWrap: { flex: 1, minWidth: 0 },
  eyebrow: { ...mobileTextStyles.caption2, fontWeight: '700', letterSpacing: 0.5 },
  booking: { ...mobileTextStyles.title2 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, padding: 11 },
  routeText: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  personCopy: { flex: 1, minWidth: 0 },
  personLabel: { ...mobileTextStyles.caption2 },
  personName: { ...mobileTextStyles.subhead, fontWeight: '600' },
  phone: { ...mobileTextStyles.caption1, maxWidth: '35%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  meta: { ...mobileTextStyles.caption1, flex: 1 },
  alert: { ...mobileTextStyles.caption1, fontWeight: '700' },
  action: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: mobileRadius.lg,
    paddingLeft: mobileSpacing.lg,
    paddingRight: mobileSpacing.sm,
  },
  actionText: { ...mobileTextStyles.headline },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
