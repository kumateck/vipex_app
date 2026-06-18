import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import type { AppearanceMode } from '@mobile/lib/storage';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard } from '@/components/ui/mobile';
import {
  runNetworkDiagnostics,
  type NetworkDiagnosticsResult,
} from '@mobile/lib/network-diagnostics';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';
import { UserType } from '@mobile/constants/user-types';

export default function ProfileTabScreen() {
  const { theme, mode, setMode } = useAppearance();
  const { session, logout } = useAuth();
  const modes: AppearanceMode[] = ['system', 'light', 'dark'];
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [networkDiagnostics, setNetworkDiagnostics] = useState<NetworkDiagnosticsResult | null>(
    null,
  );
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const userType = (() => {
    if (session.user?.userType === UserType.RIDER) return 'Rider';
    if (session.user?.userType === UserType.CASHIER) return 'Cashier';
    if (session.user?.userType === UserType.STAFF) return 'Staff';
    return '-';
  })();
  const locationLabel = session.user?.location?.name ?? session.user?.branch?.location ?? '-';

  async function handleRunDiagnostics() {
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    try {
      const result = await runNetworkDiagnostics({
        communicationToken: session.accessToken,
        livekitAccessToken: session.accessToken,
      });
      setNetworkDiagnostics(result);
    } catch (err) {
      setNetworkDiagnostics(null);
      setDiagnosticsError(err instanceof Error ? err.message : 'Diagnostics failed');
    } finally {
      setDiagnosticsLoading(false);
    }
  }

  return (
    <AppScreen>
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

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Network Diagnostics</Text>
        <AppButton
          title={diagnosticsLoading ? 'Running diagnostics...' : 'Run Network Diagnostics'}
          onPress={() => void handleRunDiagnostics()}
          disabled={diagnosticsLoading}
          variant="secondary"
        />
        {diagnosticsError ? (
          <Text style={[styles.debugText, { color: theme.colors.danger }]}>
            Diagnostics error: {diagnosticsError}
          </Text>
        ) : null}
        {networkDiagnostics?.api.probes.length ? (
          <View style={styles.diagnosticList}>
            <Text style={[styles.debugTitle, { color: theme.colors.textMuted }]}>API</Text>
            {networkDiagnostics.api.probes.map((probe) => (
              <Text
                key={probe.apiBaseUrl}
                style={[
                  styles.debugText,
                  { color: probe.ok ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {probe.apiBaseUrl}
                {' -> '}
                {probe.ok ? 'ok' : 'failed'} ({probe.status ?? '-'} / {probe.latencyMs}ms)
              </Text>
            ))}
          </View>
        ) : null}
        {networkDiagnostics?.livekit.probes.length ? (
          <View style={styles.diagnosticList}>
            <Text style={[styles.debugTitle, { color: theme.colors.textMuted }]}>LiveKit</Text>
            {networkDiagnostics.livekit.probes.map((probe) => (
              <Text
                key={probe.url}
                style={[
                  styles.debugText,
                  { color: probe.ok ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {probe.url}
                {' -> '}
                {probe.ok ? 'reachable' : 'failed'} ({probe.status ?? '-'} / {probe.latencyMs}ms)
              </Text>
            ))}
          </View>
        ) : null}
        {networkDiagnostics?.minio.probes.length ? (
          <View style={styles.diagnosticList}>
            <Text style={[styles.debugTitle, { color: theme.colors.textMuted }]}>MinIO</Text>
            {networkDiagnostics.minio.probes.map((probe) => (
              <Text
                key={probe.url}
                style={[
                  styles.debugText,
                  { color: probe.ok ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {probe.url}
                {' -> '}
                {probe.ok ? 'ok' : 'failed'} ({probe.status ?? '-'} / {probe.latencyMs}ms)
              </Text>
            ))}
          </View>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  metaRow: { lineHeight: 19 },
  modeRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  modeChip: {
    borderWidth: 1,
    borderRadius: mobileRadius.pill,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
  },
  diagnosticList: { gap: 4, marginTop: mobileSpacing.sm },
  debugTitle: { fontSize: mobileTypography.caption, fontWeight: '700' },
  debugText: { fontSize: mobileTypography.caption },
});
