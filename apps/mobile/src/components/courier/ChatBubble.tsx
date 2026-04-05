import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type ChatBubbleProps = {
  body: string;
  sentAt?: string | null;
  isMine?: boolean;
  seen?: boolean;
};

function formatTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({ body, sentAt, isMine = false, seen = false }: ChatBubbleProps) {
  const { theme } = useAppearance();

  return (
    <View style={[styles.wrap, isMine ? styles.right : styles.left]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? theme.colors.primary : theme.colors.card,
            borderColor: isMine ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <Text style={{ color: isMine ? theme.colors.primaryText : theme.colors.text }}>{body}</Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.meta,
              { color: isMine ? theme.colors.primaryText : theme.colors.textSubtle },
            ]}
          >
            {formatTime(sentAt)}
          </Text>
          {isMine ? (
            <Text
              style={[
                styles.meta,
                { color: isMine ? theme.colors.primaryText : theme.colors.textSubtle },
              ]}
            >
              {seen ? 'Seen' : 'Sent'}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: mobileSpacing.xs },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    gap: 4,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  meta: { fontSize: mobileTypography.caption, fontWeight: '600' },
});
