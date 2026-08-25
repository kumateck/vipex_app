import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { formatCedisFromPsw } from '@mobile/features/rider/hooks/use-rider-board-data';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function AssignedDeliveriesSummary(props: { count: number; expectedPsw: number }) {
  const { theme } = useAppearance();
  const foreground = theme.colors.primaryText;
  return (
    <View style={[styles.card, mobileShadow.floating, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.orb, { backgroundColor: `${foreground}12` }]} />
      <View style={styles.metric}>
        <View style={[styles.icon, { backgroundColor: `${foreground}1F` }]}>
          <Ionicons name="navigate-outline" size={21} color={foreground} />
        </View>
        <View>
          <Text style={[styles.count, { color: foreground }]}>{props.count}</Text>
          <Text style={[styles.label, { color: `${foreground}C7` }]}>Stops ready</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: `${foreground}38` }]} />
      <View style={styles.collection}>
        <Text style={[styles.eyebrow, { color: `${foreground}C7` }]}>EXPECTED COLLECTION</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.amount, { color: foreground }]}>
          {formatCedisFromPsw(props.expectedPsw)}
        </Text>
        <Text style={[styles.caption, { color: `${foreground}A8` }]}>Across active deliveries</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    minHeight: 128,
  },
  orb: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -62, top: -72 },
  metric: { flex: 0.85, flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  icon: {
    width: 40,
    height: 40,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6 },
  label: { ...mobileTextStyles.caption1, fontWeight: '600' },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: mobileSpacing.md,
  },
  collection: { flex: 1.25, minWidth: 0 },
  eyebrow: { ...mobileTextStyles.caption2, fontWeight: '700', letterSpacing: 0.3 },
  amount: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  caption: { ...mobileTextStyles.caption2, marginTop: 2 },
});
