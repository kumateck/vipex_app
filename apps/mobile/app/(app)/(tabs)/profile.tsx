import { useState } from 'react';
import { router } from '@mobile/navigation/router-compat';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import type { AppearanceMode } from '@mobile/lib/storage';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard, AppPageHeader } from '@/components/ui/mobile';
import {
  runNetworkDiagnostics,
  type NetworkDiagnosticsResult,
} from '@mobile/lib/network-diagnostics';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
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

  const accountRows: Array<[string, string]> = [
    ['Name', session.user?.fullname ?? '-'],
    ['Email', session.user?.email ?? '-'],
    ['User Type', userType],
    ['Role', session.user?.role?.name ?? '-'],
    ['Branch', session.user?.branch?.name ?? '-'],
    ['Location', locationLabel],
  ];

  return (
    <AppScreen>
      <AppPageHeader title="Profile" />

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
        <View style={styles.metaList}>
          {accountRows.map(([label, value]) => (
            <View key={label} style={[styles.metaRow, { borderTopColor: theme.colors.separator }]}>
              <Text style={[styles.metaLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
              <Text style={[styles.metaValue, { color: theme.colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>
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
          title="Run Network Diagnostics"
          onPress={() => void handleRunDiagnostics()}
          disabled={diagnosticsLoading}
          loading={diagnosticsLoading}
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
  sectionTitle: { ...mobileTextStyles.headline },
  metaList: { marginTop: -mobileSpacing.xs },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: mobileSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaLabel: { ...mobileTextStyles.subhead },
  metaValue: { ...mobileTextStyles.subhead, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  modeChip: {
    borderRadius: mobileRadius.pill,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
  },
  diagnosticList: { gap: 4, marginTop: mobileSpacing.sm },
  debugTitle: { ...mobileTextStyles.caption1, fontWeight: '700' },
  debugText: { ...mobileTextStyles.caption1 },
});
