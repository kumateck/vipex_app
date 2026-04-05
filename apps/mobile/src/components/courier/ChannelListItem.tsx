import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type ChannelListItemProps = {
  name: string;
  description?: string | null;
  unreadCount?: number;
  onPress: () => void;
};

export function ChannelListItem({
  name,
  description,
  unreadCount = 0,
  onPress,
}: ChannelListItemProps) {
  const { theme } = useAppearance();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        {
          opacity: pressed ? 0.85 : 1,
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.main}>
        <Text style={[styles.name, { color: theme.colors.text }]}>#{name}</Text>
        {description ? (
          <Text numberOfLines={1} style={[styles.description, { color: theme.colors.textSubtle }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.badgeText, { color: theme.colors.primaryText }]}>{unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    borderWidth: 1,
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  main: { flex: 1, gap: 2 },
  name: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  description: { fontSize: mobileTypography.body, fontWeight: '500' },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: mobileTypography.caption, fontWeight: '800' },
});
