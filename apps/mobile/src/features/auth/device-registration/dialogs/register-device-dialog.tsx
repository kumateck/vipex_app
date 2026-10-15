import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton, AppInput, AppLabel, PasswordInput } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  email: string;
  registering: boolean;
  onRegister: (password: string) => Promise<boolean>;
  onClose: () => void;
};

export function RegisterDeviceDialog({ email, registering, onRegister, onClose }: Props) {
  const { theme } = useAppearance();
  const [password, setPassword] = useState('');
  const close = () => {
    if (!registering) onClose();
  };
  const submit = async () => {
    if (!password || registering) return;
    if (await onRegister(password)) onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View
          style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>Register this device</Text>
          <Text style={[styles.text, { color: theme.colors.textSubtle }]}>
            Confirm your password to register this phone for approval. It does not change how you
            sign in until your company turns on device verification.
          </Text>
          <AppLabel>Email</AppLabel>
          <AppInput value={email} editable={false} />
          <AppLabel>Password</AppLabel>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            autoFocus
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
          <AppButton
            title="Register device"
            loading={registering}
            disabled={!password}
            onPress={() => void submit()}
          />
          <AppButton title="Cancel" variant="plain" disabled={registering} onPress={close} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    paddingBottom: mobileSpacing.xxl,
    gap: mobileSpacing.sm,
  },
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.footnote },
});
