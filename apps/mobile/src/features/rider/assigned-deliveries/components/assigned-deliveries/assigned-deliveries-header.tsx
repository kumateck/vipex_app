import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { router } from '@mobile/navigation/router-compat';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function AssignedDeliveriesHeader() {
  const { theme } = useAppearance();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to rider dashboard"
        hitSlop={8}
        onPress={() => router.push('/(app)/(tabs)')}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: theme.colors.card, opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Ionicons name="chevron-back" size={23} color={theme.colors.text} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Assigned Deliveries</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>Your active route</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.md },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { ...mobileTextStyles.title1 },
  subtitle: { ...mobileTextStyles.subhead, marginTop: 1 },
});
