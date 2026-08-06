import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function ParcelCreateHeader() {
  const { theme } = useAppearance();
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open side menu"
        hitSlop={8}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="menu-outline" size={26} color={theme.colors.text} />
      </Pressable>
      <View style={styles.titleGroup}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create TobePaid</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
          To be paid — the receiver pays the full charge on pickup.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  menuButton: { paddingVertical: 3, paddingRight: mobileSpacing.xs },
  titleGroup: { flex: 1, gap: 4 },
  title: { ...mobileTextStyles.largeTitle },
  subtitle: { ...mobileTextStyles.subhead },
});
