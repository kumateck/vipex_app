import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type ThreadSelectionActionsProps = {
  count: number;
  scale: number;
  onClear: () => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onStar: () => void;
  onDelete: () => void;
};

export function ThreadSelectionActions({
  count,
  scale,
  onClear,
  onReply,
  onForward,
  onPin,
  onStar,
  onDelete,
}: ThreadSelectionActionsProps) {
  const { theme } = useAppearance();
  const iconSize = 20 * scale;

  return (
    <View style={[styles.wrap, mobileShadow.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.left}>
        <Pressable
          onPress={onClear}
          style={[
            styles.iconButton,
            { width: 34 * scale, height: 34 * scale, borderRadius: 17 * scale },
          ]}
        >
          <Ionicons name="arrow-back" size={18 * scale} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.count, { color: theme.colors.text, fontSize: 24 * scale }]}>
          {count}
        </Text>
      </View>

      <View style={styles.actions}>
        <IconAction
          icon="arrow-undo-outline"
          size={iconSize}
          color={theme.colors.text}
          onPress={onReply}
        />
        <IconAction
          icon="arrow-redo-outline"
          size={iconSize}
          color={theme.colors.text}
          onPress={onForward}
        />
        <IconAction icon="pin-outline" size={iconSize} color={theme.colors.text} onPress={onPin} />
        <IconAction
          icon="star-outline"
          size={iconSize}
          color={theme.colors.text}
          onPress={onStar}
        />
        <IconAction
          icon="trash-outline"
          size={iconSize}
          color={theme.colors.danger}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

function IconAction({
  icon,
  size,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpacing.xs + 2,
    paddingVertical: mobileSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.xs + 2,
  },
  count: { ...mobileTextStyles.title2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
