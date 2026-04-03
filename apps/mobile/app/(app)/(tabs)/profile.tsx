import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import type { AppearanceMode } from '@mobile/lib/storage';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function ProfileTabScreen() {
  const { theme, mode, setMode } = useAppearance();
  const { session, logout } = useAuth();
  const modes: AppearanceMode[] = ['system', 'light', 'dark'];

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Account details and app preferences.
      </Text>

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
      </AppCard>

      <Link href="/(app)/change-password" style={[styles.link, { color: theme.colors.primary }]}>
        Change Password
      </Link>
      <AppButton title="Logout" onPress={() => void logout()} variant="secondary" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  metaRow: { lineHeight: 19 },
  link: { fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  modeChip: {
    borderWidth: 1,
    borderRadius: mobileRadius.pill,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
  },
});
