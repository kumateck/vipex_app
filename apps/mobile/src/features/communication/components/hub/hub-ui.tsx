import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing } from '@mobile/theme/layout';
import type { CommunicationTabKey } from '@mobile/features/communication/types/hub';
import { getMobileScale } from '@mobile/features/communication/utils';

const TAB_OPTIONS: Array<{
  key: CommunicationTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
  { key: 'channels', label: 'Channels', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'requests', label: 'Requests', icon: 'document-text-outline' },
];

export function HubHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const { theme } = useAppearance();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  return (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel="Open side menu"
          style={styles.menuButton}
        >
          <Ionicons name="menu-outline" size={24 * scale} color={theme.colors.text} />
        </Pressable>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: 34 * scale, lineHeight: 38 * scale },
          ]}
        >
          Chats
        </Text>
      </View>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSubtle, fontSize: 16 * scale, lineHeight: 20 * scale },
        ]}
      >
        Conversations
      </Text>
    </View>
  );
}

export function HubTabBar({
  activeTab,
  onChange,
}: {
  activeTab: CommunicationTabKey;
  onChange: (tab: CommunicationTabKey) => void;
}) {
  const { theme } = useAppearance();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  return (
    <View
      style={[
        styles.tabsWrap,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
      ]}
    >
      {TAB_OPTIONS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            style={[
              styles.tabButton,
              {
                backgroundColor: active ? theme.colors.primary : 'transparent',
                minHeight: 39 * scale,
              },
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={tab.icon}
                size={16 * scale}
                color={active ? theme.colors.primaryText : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: active ? theme.colors.primaryText : theme.colors.textMuted,
                    fontSize: 10 * scale,
                    lineHeight: 11 * scale,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ title }: { title: string }) {
  const { theme } = useAppearance();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, fontSize: 13 * scale }]}>
      {title}
    </Text>
  );
}

export function EmptyText({ value }: { value: string }) {
  const { theme } = useAppearance();
  return <Text style={{ color: theme.colors.textSubtle }}>{value}</Text>;
}

export function BadgeText({ value, tone }: { value: string; tone: 'primary' | 'danger' }) {
  const { theme } = useAppearance();
  const isDanger = tone === 'danger';
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDanger ? theme.colors.danger : theme.colors.primary,
        },
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

export function formatTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString();
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

export const hubStyles = StyleSheet.create({
  contentScroll: { flex: 1 },
  contentContainer: { gap: mobileSpacing.md, paddingBottom: mobileSpacing.xl },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12 },
  rowTime: { fontSize: 11 },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  voiceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: mobileSpacing.sm },
  controlsRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  voiceButton: {
    marginTop: mobileSpacing.sm,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  requestTargetPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  manageWrap: { marginTop: mobileSpacing.sm, gap: 8 },
  waRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: { width: 50, height: 50, position: 'relative' },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 17 },
  presenceDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  waCenter: { flex: 1, minWidth: 0, gap: 1 },
  waName: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  waMeta: { fontSize: 13, lineHeight: 17 },
  waPreview: { fontSize: 14, marginTop: 1, lineHeight: 18 },
  waRight: { alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 44, width: 64 },
  waTime: { fontSize: 13, fontWeight: '600' },
  unreadPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  headerBlock: { gap: mobileSpacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuButton: { paddingHorizontal: 2, paddingVertical: 2 },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 38 },
  subtitle: { marginTop: -2, fontSize: 16, lineHeight: 20, marginBottom: mobileSpacing.xs },
  tabsWrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontWeight: '700', textAlign: 'center' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: mobileSpacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 22,
    alignItems: 'center',
  },
});
