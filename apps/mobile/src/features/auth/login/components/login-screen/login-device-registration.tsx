import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { DeviceStatus } from '@mobile/lib/device-registration';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  deviceStatus: DeviceStatus | null;
  registerDisabled: boolean;
  checkDisabled: boolean;
  onRegister: () => void;
  onCheck: () => void;
};

const STATUS_MESSAGES: Record<DeviceStatus, string> = {
  pending: 'Registered. Waiting for an administrator to approve this device.',
  approved: 'Approved. You can sign in on this device.',
  revoked: 'Approval was revoked. Ask an administrator to approve it again.',
  blocked: 'This device is blocked. Contact your administrator.',
  permanently_denied: 'This device can no longer be approved. Contact your administrator.',
};

export function LoginDeviceRegistration({
  deviceStatus,
  registerDisabled,
  checkDisabled,
  onRegister,
  onCheck,
}: Props) {
  const { theme } = useAppearance();
  const positive = deviceStatus === 'approved';
  return (
    <View style={styles.container}>
      <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
        If your company requires device verification, register this phone with your email and
        password, then wait for approval before signing in.
      </Text>
      {deviceStatus ? (
        <View
          style={[
            styles.status,
            { backgroundColor: `${positive ? theme.colors.primary : theme.colors.secondary}12` },
          ]}
        >
          <Ionicons
            name={positive ? 'checkmark-circle-outline' : 'time-outline'}
            size={18}
            color={positive ? theme.colors.primary : theme.colors.secondary}
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {STATUS_MESSAGES[deviceStatus]}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Register this device"
        disabled={registerDisabled}
        onPress={onRegister}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: theme.colors.secondary,
            opacity: registerDisabled ? 0.45 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.secondary} />
        <Text style={[styles.buttonText, { color: theme.colors.secondary }]}>
          Register this device
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={checkDisabled}
        onPress={onCheck}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: checkDisabled ? 0.45 : pressed ? 0.6 : 1 })}
      >
        <Text style={[styles.link, { color: theme.colors.secondary }]}>Check approval status</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: mobileSpacing.sm },
  helper: { ...mobileTextStyles.footnote },
  status: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    padding: mobileSpacing.md,
    borderRadius: mobileRadius.md,
  },
  statusText: { ...mobileTextStyles.footnote, flex: 1, fontWeight: '600' },
  button: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: mobileRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.sm,
  },
  buttonText: { ...mobileTextStyles.headline },
  link: { ...mobileTextStyles.footnote, fontWeight: '700', textAlign: 'center' },
});
