import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { normalizeMentionHandle } from '@mobile/features/communication/utils/thread-mentions';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CommunicationMessage, MobileUserOption } from '@mobile/types/communication';

type ThreadDisplayMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

const QUICK_ACTIONS = ['Photo', 'Camera', 'Location', 'Contact'];

export function ThreadComposer({
  scale,
  text,
  setText,
  setSelection,
  sending,
  onSend,
  showActions,
  setShowActions,
  activeMention,
  mentionSuggestions,
  insertMention,
  replyToMessage,
  replySenderLabel,
  onClearReply,
}: {
  scale: number;
  text: string;
  setText: (value: string) => void;
  setSelection: (selection: { start: number; end: number }) => void;
  sending: boolean;
  onSend: () => void;
  showActions: boolean;
  setShowActions: (updater: (prev: boolean) => boolean) => void;
  activeMention: unknown;
  mentionSuggestions: MobileUserOption[];
  insertMention: (user: MobileUserOption | 'everyone') => void;
  replyToMessage: ThreadDisplayMessage | null;
  replySenderLabel: string;
  onClearReply: () => void;
}) {
  const { theme } = useAppearance();

  return (
    <>
      {showActions ? (
        <View
          style={[styles.actionsTray, mobileShadow.card, { backgroundColor: theme.colors.card }]}
        >
          {QUICK_ACTIONS.map((label) => (
            <View key={label} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.cardMuted }]}>
                <Ionicons
                  name={
                    label === 'Photo'
                      ? 'image-outline'
                      : label === 'Camera'
                        ? 'camera-outline'
                        : label === 'Location'
                          ? 'location-outline'
                          : 'person-outline'
                  }
                  size={18 * scale}
                  color={theme.colors.textMuted}
                />
              </View>
              <Text
                style={[styles.actionText, { color: theme.colors.textMuted, fontSize: 12 * scale }]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {activeMention ? (
        <View
          style={[
            styles.suggestionsWrap,
            mobileShadow.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Pressable
            onPress={() => insertMention('everyone')}
            style={[styles.suggestionItem, { backgroundColor: theme.colors.cardMuted }]}
          >
            <Text style={{ color: theme.colors.text }}>@everyone</Text>
          </Pressable>
          {mentionSuggestions.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => insertMention(user)}
              style={[styles.suggestionItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <Text style={{ color: theme.colors.text }}>
                @{normalizeMentionHandle(user.email.split('@')[0] ?? user.fullname)}
              </Text>
              <Text style={{ color: theme.colors.textSubtle, fontSize: 12 * scale }}>
                {user.fullname}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {replyToMessage ? (
        <View
          style={[
            styles.replyBar,
            {
              borderLeftColor: theme.colors.primary,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <View style={styles.replyMeta}>
            <Text style={[styles.replyTitle, { color: theme.colors.primary }]} numberOfLines={1}>
              {replySenderLabel}
            </Text>
            <Text style={[styles.replyText, { color: theme.colors.textSubtle }]} numberOfLines={2}>
              {(replyToMessage.body ?? '').trim() || '(attachment)'}
            </Text>
          </View>
          <Pressable onPress={onClearReply} style={styles.replyCloseButton}>
            <Ionicons name="close" size={18 * scale} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.composerRow, mobileShadow.floating]}>
        <Pressable
          onPress={() => setShowActions((prev) => !prev)}
          style={[
            styles.iconButton,
            {
              backgroundColor: theme.colors.card,
              width: 42 * scale,
              height: 42 * scale,
              borderRadius: 21 * scale,
            },
          ]}
        >
          <Ionicons name="add" size={22 * scale} color={theme.colors.textMuted} />
        </Pressable>

        <View style={[styles.inputWrap, { backgroundColor: theme.colors.card }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSubtle}
            style={[
              styles.input,
              { color: theme.colors.text, fontSize: 16 * scale, lineHeight: 20 * scale },
            ]}
            multiline
          />
          <Ionicons name="camera-outline" size={20 * scale} color={theme.colors.textMuted} />
        </View>

        <Pressable
          onPress={onSend}
          disabled={sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: sending ? 0.7 : 1,
              width: 42 * scale,
              height: 42 * scale,
              borderRadius: 21 * scale,
            },
          ]}
        >
          <Ionicons
            name={text.trim().length ? 'send' : 'mic-outline'}
            size={18 * scale}
            color={theme.colors.primaryText}
          />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actionsTray: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md - 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: { alignItems: 'center', gap: mobileSpacing.xs + 2 },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { ...mobileTextStyles.caption1, fontWeight: '600' },
  suggestionsWrap: {
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm,
    gap: mobileSpacing.xs + 2,
  },
  suggestionItem: {
    borderRadius: mobileRadius.sm + 2,
    paddingHorizontal: mobileSpacing.sm + 2,
    paddingVertical: mobileSpacing.sm,
    gap: 2,
  },
  replyBar: {
    borderLeftWidth: 3,
    borderRadius: mobileRadius.md,
    paddingLeft: mobileSpacing.sm + 2,
    paddingRight: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm - 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  replyMeta: { flex: 1 },
  replyTitle: { ...mobileTextStyles.caption2, fontWeight: '700' },
  replyText: { ...mobileTextStyles.caption2, marginTop: 1 },
  replyCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: mobileSpacing.sm },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 42,
    borderRadius: mobileRadius.xl,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  input: { flex: 1, fontSize: 16, maxHeight: 92, lineHeight: 20 },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
