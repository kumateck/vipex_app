import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function ThreadHeader({
  title,
  participantCount,
  typingLabel,
  isSocketConnected,
  isDirectThread,
  scale,
  onBackPress,
  onCallPress,
}: {
  title: string;
  participantCount: number;
  typingLabel: string | null;
  isSocketConnected: boolean;
  isDirectThread: boolean;
  scale: number;
  onBackPress: () => void;
  onCallPress: () => void;
}) {
  const { theme } = useAppearance();
  const initials = getInitials(title);
  const avatarSize = 42 * scale;
  const iconSize = 20 * scale;

  const subtitleText = isDirectThread
    ? (typingLabel ?? '')
    : `${participantCount} user${participantCount === 1 ? '' : 's'}${typingLabel ? ` • ${typingLabel}` : ''}`;
  const showSubtitle = subtitleText.trim().length > 0;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Pressable
          onPress={onBackPress}
          style={[
            styles.backButton,
            mobileShadow.card,
            {
              backgroundColor: theme.colors.card,
              width: 34 * scale,
              height: 34 * scale,
              borderRadius: 17 * scale,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18 * scale} color={theme.colors.text} />
        </Pressable>

        <View
          style={[
            styles.avatar,
            mobileShadow.card,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: theme.colors.cardMuted,
            },
          ]}
        >
          <Text
            style={[styles.avatarText, { color: theme.colors.textMuted, fontSize: 14 * scale }]}
          >
            {initials}
          </Text>
        </View>

        <View style={styles.textWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: 18 * scale,
                lineHeight: 22 * scale,
              },
            ]}
          >
            {title}
          </Text>
          {showSubtitle ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isSocketConnected
                      ? theme.colors.indicatorOnline
                      : theme.colors.indicatorMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: typingLabel ? theme.colors.indicatorOnline : theme.colors.textSubtle,
                    fontSize: 13 * scale,
                    lineHeight: 17 * scale,
                  },
                ]}
              >
                {subtitleText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onCallPress}
        style={[
          styles.callButton,
          mobileShadow.card,
          {
            backgroundColor: theme.colors.card,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        <Ionicons name="call-outline" size={iconSize} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  header: {
    gap: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm + 2,
    flex: 1,
    minWidth: 0,
  },
  textWrap: { gap: 2, flex: 1, minWidth: 0 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  title: { ...mobileTextStyles.headline },
  subtitle: { marginBottom: 2 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.xs + 2,
    marginBottom: 2,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  callButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
