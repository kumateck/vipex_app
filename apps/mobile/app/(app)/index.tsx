import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import type { AppearanceMode } from '@mobile/lib/storage';
import {
  canUseQueueModule,
  canUseRiderModule,
  canUseTransitReceiveScan,
} from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function MobileHomeScreen() {
  const { theme, mode, setMode } = useAppearance();
  const { session, logout } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const branchContact =
    session.user?.branch?.telephone?.trim() || session.user?.branch?.phone?.trim() || '-';
  const branchLocation =
    session.user?.location?.name?.trim() ||
    session.user?.branch?.location?.trim() ||
    session.user?.branch?.address?.trim() ||
    '-';

  const canQueue = canUseQueueModule(permissions);
  const canRider = canUseRiderModule(permissions);
  const canReceive = canUseTransitReceiveScan(permissions);
  const modes: AppearanceMode[] = ['system', 'light', 'dark'];

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Welcome, {session.user?.fullname ?? session.user?.email ?? 'User'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Mobile workspace for queueing, receiving, and rider operations.
      </Text>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Appearance</Text>
        <View style={styles.modeRow}>
          {modes.map((item) => {
            const selected = item === mode;
            return (
              <Pressable
                key={item}
                style={[
                  styles.modeChip,
                  {
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected ? theme.colors.primary : theme.colors.cardMuted,
                  },
                ]}
                onPress={() => void setMode(item)}
              >
                <Text
                  style={{
                    color: selected ? theme.colors.primaryText : theme.colors.textMuted,
                    fontWeight: '700',
                    textTransform: 'capitalize',
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Profile</Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Full Name: {session.user?.fullname ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Email: {session.user?.email ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Role: {session.user?.role?.name ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Company: {session.user?.company?.name ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Branch: {session.user?.branch?.name ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Branch Location: {branchLocation}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Branch Contact: {branchContact}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Permissions: {permissions.length}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Quick Access</Text>
        {canQueue ? (
          <Link href="/(app)/queue" asChild>
            <Pressable style={styles.linkRow}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Open Queue Operations
              </Text>
            </Pressable>
          </Link>
        ) : (
          <Text style={[styles.disabled, { color: theme.colors.textSubtle }]}>
            Queue module unavailable for your permissions.
          </Text>
        )}
        {canRider ? (
          <Link href="/(app)/rider" asChild>
            <Pressable style={styles.linkRow}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Open Rider Operations
              </Text>
            </Pressable>
          </Link>
        ) : (
          <Text style={[styles.disabled, { color: theme.colors.textSubtle }]}>
            Rider module unavailable for your permissions.
          </Text>
        )}
        {canReceive ? (
          <Link href="/(app)/receive" asChild>
            <Pressable style={styles.linkRow}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Open Scan To Receive
              </Text>
            </Pressable>
          </Link>
        ) : (
          <Text style={[styles.disabled, { color: theme.colors.textSubtle }]}>
            Transit receive scan unavailable for your permissions.
          </Text>
        )}
      </AppCard>

      <Link href="/(app)/change-password" asChild>
        <Pressable>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>Change Password</Text>
        </Pressable>
      </Link>
      <AppButton title="Logout" onPress={() => void logout()} variant="secondary" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  metaRow: { lineHeight: 19 },
  cardTitle: { fontWeight: '700', fontSize: mobileTypography.sectionTitle },
  disabled: { fontSize: mobileTypography.label },
  linkRow: { paddingVertical: mobileSpacing.sm },
  linkText: { fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  modeChip: {
    borderWidth: 1,
    borderRadius: mobileRadius.pill,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
  },
});
