import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { formatCedisFromPsw } from '@mobile/features/rider/hooks/use-rider-board-data';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { getExpectedCollectionPsw } from '../../utils';

type Props = {
  delivery: RiderDoorstepRecord;
  expanded: boolean;
  onToggle: (parcelId: string) => void;
};

export const AssignedDeliveryCard = memo(function AssignedDeliveryCard({
  delivery,
  expanded,
  onToggle,
}: Props) {
  const { theme } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expanded ? 'Close' : 'Open'} delivery ${delivery.bookingCode}`}
      onPress={() => onToggle(delivery.parcelId)}
      style={({ pressed }) => [
        styles.card,
        mobileShadow.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: expanded ? `${theme.colors.primary}70` : 'transparent',
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.bookingWrap}>
          <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>BOOKING</Text>
          <Text numberOfLines={1} style={[styles.booking, { color: theme.colors.text }]}>
            {delivery.bookingCode}
          </Text>
        </View>
        <View style={[styles.readyBadge, { backgroundColor: `${theme.colors.success}16` }]}>
          <View style={[styles.readyDot, { backgroundColor: theme.colors.success }]} />
          <Text style={[styles.readyText, { color: theme.colors.success }]}>Ready</Text>
        </View>
      </View>

      <View style={styles.personRow}>
        <View style={[styles.avatar, { backgroundColor: `${theme.colors.secondary}18` }]}>
          <Ionicons name="person-outline" size={19} color={theme.colors.secondary} />
        </View>
        <View style={styles.personCopy}>
          <Text numberOfLines={1} style={[styles.receiver, { color: theme.colors.text }]}>
            {delivery.receiverName ?? 'Receiver not available'}
          </Text>
          <Text style={[styles.phone, { color: theme.colors.textMuted }]}>
            {delivery.receiverPhone ?? 'No phone number'}
          </Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={17} color={theme.colors.textSubtle} />
        <Text numberOfLines={2} style={[styles.address, { color: theme.colors.textMuted }]}>
          {delivery.dropoffAddress ?? 'Drop-off address not provided'}
        </Text>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.separator }]}>
        <View>
          <Text style={[styles.collectLabel, { color: theme.colors.textSubtle }]}>TO COLLECT</Text>
          <Text style={[styles.collectAmount, { color: theme.colors.text }]}>
            {formatCedisFromPsw(getExpectedCollectionPsw(delivery))}
          </Text>
        </View>
        <View style={[styles.openIcon, { backgroundColor: theme.colors.cardMuted }]}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textMuted}
          />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: mobileRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: mobileSpacing.lg,
    gap: mobileSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  bookingWrap: { flex: 1, minWidth: 0 },
  eyebrow: { ...mobileTextStyles.caption2, fontWeight: '700', letterSpacing: 0.5 },
  booking: { ...mobileTextStyles.title3, fontWeight: '700', marginTop: 1 },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: mobileRadius.pill,
  },
  readyDot: { width: 6, height: 6, borderRadius: 3 },
  readyText: { ...mobileTextStyles.caption1, fontWeight: '700' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCopy: { flex: 1, minWidth: 0 },
  receiver: { ...mobileTextStyles.headline },
  phone: { ...mobileTextStyles.caption1, marginTop: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  address: { ...mobileTextStyles.footnote, flex: 1, minWidth: 0 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: mobileSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectLabel: { ...mobileTextStyles.caption2, fontWeight: '700', letterSpacing: 0.4 },
  collectAmount: { ...mobileTextStyles.headline, fontWeight: '800', marginTop: 1 },
  openIcon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
