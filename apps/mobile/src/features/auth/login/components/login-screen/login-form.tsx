import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Link } from '@mobile/navigation/router-compat';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { LoginFormProps } from '../../types';
import { LoginField } from './login-field';

export function LoginForm({
  email,
  error,
  loading,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  const { theme } = useAppearance();
  const disabled = loading || !email.trim() || !password;
  const passwordInputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.card,
        mobileShadow.floating,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.scheme === 'dark' ? theme.colors.border : `${theme.colors.primary}12`,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Sign in</Text>
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>
          Use your staff account to continue
        </Text>
      </View>

      <LoginField
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@company.com"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
      />

      <View style={styles.passwordBlock}>
        <LoginField
          label="Password"
          icon="lock-closed-outline"
          inputRef={passwordInputRef}
          value={password}
          onChangeText={onPasswordChange}
          autoCapitalize="none"
          autoComplete="current-password"
          placeholder="Enter your password"
          password
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.forgotLink, { color: theme.colors.secondary }]}>
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>

      {error ? (
        <View style={[styles.error, { backgroundColor: `${theme.colors.danger}12` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
            transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <>
            <Text style={[styles.buttonText, { color: theme.colors.primaryText }]}>
              Continue securely
            </Text>
            <Ionicons name="arrow-forward" size={19} color={theme.colors.primaryText} />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    gap: mobileSpacing.lg,
  },
  header: { gap: 3 },
  heading: { ...mobileTextStyles.title2 },
  helper: { ...mobileTextStyles.footnote },
  passwordBlock: { gap: mobileSpacing.sm },
  forgotLink: { ...mobileTextStyles.footnote, fontWeight: '700', textAlign: 'right' },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    padding: mobileSpacing.md,
    borderRadius: mobileRadius.md,
  },
  errorText: { ...mobileTextStyles.footnote, flex: 1, fontWeight: '600' },
  button: {
    minHeight: 56,
    borderRadius: mobileRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.sm,
  },
  buttonText: { ...mobileTextStyles.headline },
});
