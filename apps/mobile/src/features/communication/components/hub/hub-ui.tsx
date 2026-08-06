import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { CommunicationTabKey } from '@mobile/features/communication/types/hub';
import { getMobileScale } from '@mobile/features/communication/utils';

export { hubStyles } from './hub-styles';

const TAB_OPTIONS: Array<{
  key: CommunicationTabKey;
  label: string;
  icon: string;
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
            {
              color: theme.colors.text,
              fontSize: mobileTextStyles.largeTitle.fontSize * scale,
              lineHeight: mobileTextStyles.largeTitle.lineHeight * scale,
            },
          ]}
        >
          Chats
        </Text>
      </View>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.textSubtle,
            fontSize: mobileTextStyles.body.fontSize * scale,
            lineHeight: mobileTextStyles.body.lineHeight * scale,
          },
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
        mobileShadow.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
          borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
        },
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
              active ? mobileShadow.card : null,
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
                    fontSize: mobileTextStyles.caption2.fontSize * scale,
                    lineHeight: mobileTextStyles.caption2.lineHeight * scale,
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
    <Text
      style={[
        styles.sectionTitle,
        {
          color: theme.colors.textMuted,
          fontSize: mobileTextStyles.eyebrow.fontSize * scale,
        },
      ]}
    >
      {title}
    </Text>
  );
}

export function EmptyText({ value }: { value: string }) {
  const { theme } = useAppearance();
  return <Text style={[mobileTextStyles.body, { color: theme.colors.textSubtle }]}>{value}</Text>;
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
      <Text style={[styles.badgeText, { color: theme.colors.primaryText }]}>{value}</Text>
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

const styles = StyleSheet.create({
  headerBlock: { gap: mobileSpacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm + 2 },
  menuButton: { paddingHorizontal: 2, paddingVertical: 2 },
  title: { ...mobileTextStyles.largeTitle, fontWeight: '800' },
  subtitle: {
    marginTop: -2,
    ...mobileTextStyles.body,
    marginBottom: mobileSpacing.xs,
  },
  tabsWrap: {
    borderRadius: mobileRadius.lg,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: mobileRadius.md,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.sm,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontWeight: '700', textAlign: 'center' },
  sectionTitle: {
    ...mobileTextStyles.eyebrow,
    marginTop: mobileSpacing.sm,
    textTransform: 'uppercase',
  },
  badge: {
    borderRadius: mobileRadius.pill,
    paddingVertical: 2,
    paddingHorizontal: mobileSpacing.sm,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: { ...mobileTextStyles.caption2, fontWeight: '700' },
});
