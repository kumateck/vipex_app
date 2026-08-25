import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

export function DashboardMenuButton({ inverted = false }: { inverted?: boolean }) {
  const { theme } = useAppearance();
  const navigation = useNavigation();
  const color = inverted ? theme.colors.primaryText : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={8}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: inverted ? `${color}1F` : theme.colors.card,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Ionicons name="menu-outline" size={24} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: mobileSpacing.sm,
  },
});
