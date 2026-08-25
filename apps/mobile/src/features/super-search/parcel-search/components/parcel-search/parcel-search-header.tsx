import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function ParcelSearchHeader() {
  const { theme } = useAppearance();

  return (
    <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.orbLarge} />
      <View style={styles.orbSmall} />
      <View style={styles.iconWrap}>
        <Ionicons name="cube-outline" size={24} color={theme.colors.primaryText} />
      </View>
      <Text style={[styles.eyebrow, { color: theme.colors.primaryText }]}>VIP PARCEL FINDER</Text>
      <Text style={[styles.title, { color: theme.colors.primaryText }]}>Find any parcel</Text>
      <Text style={[styles.subtitle, { color: theme.colors.primaryText }]}>
        Search by booking code, customer name, or phone number.
      </Text>
      <View style={styles.scopeChip}>
        <Ionicons name="layers-outline" size={14} color={theme.colors.primaryText} />
        <Text style={[styles.scopeText, { color: theme.colors.primaryText }]}>
          Active, void and deleted records
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 224,
    overflow: 'hidden',
    borderRadius: mobileRadius.xl + 6,
    padding: mobileSpacing.xl,
    justifyContent: 'flex-end',
  },
  orbLarge: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -54,
    top: -58,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  orbSmall: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    right: 66,
    top: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mobileSpacing.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  eyebrow: { ...mobileTextStyles.eyebrow, opacity: 0.82 },
  title: { ...mobileTextStyles.largeTitle, marginTop: 2 },
  subtitle: { ...mobileTextStyles.subhead, opacity: 0.86, marginTop: 4, maxWidth: 285 },
  scopeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 7,
    marginTop: mobileSpacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scopeText: { ...mobileTextStyles.caption1, fontWeight: '600' },
});
