import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatMoneyPsw } from '../../utils';

export function RiderAmountHero({ amountPsw }: { amountPsw: number }) {
  const { theme } = useAppearance();
  const foreground = theme.colors.primaryText;

  return (
    <View style={[styles.card, mobileShadow.floating, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.orbLarge, { backgroundColor: `${foreground}10` }]} />
      <View style={[styles.orbSmall, { backgroundColor: `${foreground}14` }]} />
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${foreground}1F` }]}>
          <Ionicons name="wallet-outline" size={21} color={foreground} />
        </View>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: foreground }]} />
          <Text style={[styles.liveText, { color: foreground }]}>Today</Text>
        </View>
      </View>
      <View>
        <Text style={[styles.label, { color: `${foreground}B8` }]}>TOTAL AMOUNT RECEIVED</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.amount, { color: foreground }]}>
          {formatMoneyPsw(amountPsw)}
        </Text>
        <Text style={[styles.caption, { color: `${foreground}B8` }]}>
          Cash currently held from completed deliveries
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.xl,
    gap: mobileSpacing.xl,
  },
  orbLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -70,
    top: -85,
  },
  orbSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    left: -35,
    bottom: -42,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { ...mobileTextStyles.caption1, fontWeight: '700' },
  label: { ...mobileTextStyles.eyebrow },
  amount: { fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8 },
  caption: { ...mobileTextStyles.caption1, marginTop: 3 },
});
