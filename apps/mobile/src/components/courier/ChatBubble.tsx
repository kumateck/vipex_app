import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          {
            backgroundColor: isMine ? theme.colors.primary : theme.colors.cardMuted,
            borderColor: theme.scheme === 'dark' && !isMine ? theme.colors.border : 'transparent',
            borderWidth: theme.scheme === 'dark' && !isMine ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <Text
          style={{
            color: isMine ? theme.colors.primaryText : theme.colors.text,
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {body}
        </Text>
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
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm + 2,
    gap: 4,
  },
  bubbleMine: { borderBottomRightRadius: mobileRadius.sm },
  bubbleTheirs: { borderBottomLeftRadius: mobileRadius.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  meta: { ...mobileTextStyles.caption2, fontWeight: '600' },
});
