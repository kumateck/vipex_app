import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { mobileRadius } from '@mobile/theme/layout';
import { RegisterDeviceDialog } from '../../dialogs';
import { useMobileDevicePrompt } from '../../hooks';

export function RegisterDeviceButton({ inverted = false }: { inverted?: boolean }) {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const email = session.user?.email ?? '';
  const { needsRegistration, registering, register } = useMobileDevicePrompt();
  const [open, setOpen] = useState(false);
  if (!needsRegistration || !email) return null;
  const color = inverted ? theme.colors.primaryText : theme.colors.text;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Register this device"
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: inverted ? `${color}1F` : theme.colors.card,
            opacity: pressed ? 0.65 : 1,
          },
        ]}
      >
        <Ionicons name="phone-portrait-outline" size={22} color={color} />
      </Pressable>
      {open ? (
        <RegisterDeviceDialog
          email={email}
          registering={registering}
          onRegister={(password) => register(email, password)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
