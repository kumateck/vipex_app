import { StyleSheet, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';

export function LoginBackground() {
  const { theme } = useAppearance();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.orb,
          styles.primaryOrb,
          { backgroundColor: `${theme.colors.primary}${theme.scheme === 'dark' ? '1F' : '14'}` },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.secondaryOrb,
          { backgroundColor: `${theme.colors.secondary}${theme.scheme === 'dark' ? '14' : '0D'}` },
        ]}
      />
      <View style={[styles.accentLine, { backgroundColor: `${theme.colors.primary}66` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  primaryOrb: {
    width: 310,
    height: 310,
    top: -170,
    right: -150,
  },
  secondaryOrb: {
    width: 230,
    height: 230,
    bottom: -120,
    left: -120,
  },
  accentLine: {
    position: 'absolute',
    top: 102,
    right: -24,
    width: 110,
    height: 2,
    transform: [{ rotate: '-38deg' }],
  },
});
