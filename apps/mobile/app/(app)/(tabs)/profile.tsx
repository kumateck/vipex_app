import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import type { AppearanceMode } from '@mobile/lib/storage';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { StatCard } from '@mobile/components/courier';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';
import { UserType } from '@/db/schemas/enums';

export default function ProfileTabScreen() {
  const { theme, mode, setMode } = useAppearance();
  const { session, logout } = useAuth();
  const modes: AppearanceMode[] = ['system', 'light', 'dark'];
  const userType = (() => {
    if (session.user?.userType === UserType.RIDER) return 'Rider';
    if (session.user?.userType === UserType.CASHIER) return 'Cashier';
    if (session.user?.userType === UserType.STAFF) return 'Staff';
    return '-';
  })();
  const locationLabel = session.user?.location?.name ?? session.user?.branch?.location ?? '-';

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Account details and app preferences.
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Snapshot</Text>
        <View style={styles.statsGrid}>
          <StatCard label="User Type" value={userType} />
          <StatCard label="Role" value={session.user?.role?.name ?? '-'} />
          <StatCard label="Name" value={session.user?.fullname ?? '-'} />
          <StatCard label="Branch" value={session.user?.branch?.name ?? '-'} />
          <StatCard label="Location" value={locationLabel} />
          <StatCard label="Email" value={session.user?.email ?? '-'} />
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
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
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Name: {session.user?.fullname ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Email: {session.user?.email ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          User Type: {userType}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Role: {session.user?.role?.name ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Branch: {session.user?.branch?.name ?? '-'}
        </Text>
        <Text style={[styles.metaRow, { color: theme.colors.textMuted }]}>
          Location: {locationLabel}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security</Text>
        <AppButton
          title="Change Password"
          onPress={() => router.push('/(app)/change-password' as never)}
          variant="secondary"
        />
        <AppButton title="Logout" onPress={() => void logout()} variant="secondary" />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  metaRow: { lineHeight: 19 },
  modeRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  modeChip: {
    borderWidth: 1,
    borderRadius: mobileRadius.pill,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
  },
});
