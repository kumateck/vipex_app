import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function QueueHeader({ branchName }: { branchName: string }) {
  const navigation = useNavigation();
  const { theme } = useAppearance();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={8}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={({ pressed }) => [
          styles.menuButton,
          { backgroundColor: theme.colors.card, opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Ionicons name="menu-outline" size={24} color={theme.colors.text} />
      </Pressable>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Queue</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]} numberOfLines={1}>
          {branchName === '-' ? 'Pickup operations' : `${branchName} pickup operations`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm + 2 },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, gap: 1 },
  title: { ...mobileTextStyles.title1, fontWeight: '800' },
  subtitle: { ...mobileTextStyles.caption1 },
});
