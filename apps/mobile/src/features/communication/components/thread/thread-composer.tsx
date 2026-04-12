import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { normalizeMentionHandle } from '@mobile/features/communication/utils/thread-mentions';
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
          style={[
            styles.actionsTray,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          {QUICK_ACTIONS.map((label) => (
            <View key={label} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.bgElevated }]}>
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
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
          <Pressable
            onPress={() => insertMention('everyone')}
            style={[styles.suggestionItem, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text }}>@everyone</Text>
          </Pressable>
          {mentionSuggestions.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => insertMention(user)}
              style={[styles.suggestionItem, { borderColor: theme.colors.border }]}
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
              borderColor: theme.colors.border,
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

      <View style={styles.composerRow}>
        <Pressable
          onPress={() => setShowActions((prev) => !prev)}
          style={[
            styles.iconButton,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              width: 42 * scale,
              height: 42 * scale,
              borderRadius: 21 * scale,
            },
          ]}
        >
          <Ionicons name="add" size={22 * scale} color={theme.colors.textMuted} />
        </Pressable>

        <View
          style={[
            styles.inputWrap,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
          ]}
        >
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
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  suggestionsWrap: { borderWidth: 1, borderRadius: 12, padding: 8, gap: 6 },
  suggestionItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  replyBar: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyMeta: { flex: 1 },
  replyTitle: { fontSize: 11, fontWeight: '700' },
  replyText: { marginTop: 1, fontSize: 11, lineHeight: 14 },
  replyCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
