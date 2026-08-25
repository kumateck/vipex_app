import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import vipexLogo from '../../../../../../assets/icon.png';

export function LoginHero() {
  const { theme } = useAppearance();

  return (
    <View style={styles.container}>
      <View style={[styles.logoHalo, { backgroundColor: `${theme.colors.primary}16` }]}>
        <View
          style={[
            styles.logoFrame,
            mobileShadow.card,
            {
              backgroundColor: theme.colors.bgElevated,
              borderColor: `${theme.colors.primary}22`,
            },
          ]}
        >
          <Image source={vipexLogo} resizeMode="contain" style={styles.logo} />
        </View>
      </View>

      <View style={styles.copy}>
        <View style={[styles.eyebrow, { backgroundColor: `${theme.colors.primary}14` }]}>
          <View style={[styles.eyebrowDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.eyebrowText, { color: theme.colors.primary }]}>VIPEX MOBILE</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Your parcel operations, all in one place.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: mobileSpacing.md,
  },
  logoHalo: {
    width: 106,
    height: 106,
    borderRadius: 53,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    width: 84,
    height: 84,
    borderRadius: mobileRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 68, height: 68 },
  copy: { alignItems: 'center', gap: 6 },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: mobileRadius.pill,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { ...mobileTextStyles.caption2, fontWeight: '800', letterSpacing: 1.2 },
  title: { ...mobileTextStyles.largeTitle, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  subtitle: { ...mobileTextStyles.body, textAlign: 'center' },
});
