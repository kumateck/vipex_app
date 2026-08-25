import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { router } from '@mobile/navigation/router-compat';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function ParcelDetailsHeader({ bookingCode }: { bookingCode?: string }) {
  const { theme } = useAppearance();

  const goBackToSearch = () => {
    router.push({ pathname: '/(app)', params: { screen: 'ParcelsTab' } });
  };

  return (
    <View style={styles.header}>
      <Pressable
        onPress={goBackToSearch}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to parcel search"
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="arrow-back" size={21} color={theme.colors.text} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>PARCEL RECORD</Text>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {bookingCode?.trim() || 'Parcel details'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.md },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { ...mobileTextStyles.eyebrow },
  title: { ...mobileTextStyles.title2 },
});
