import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type LoginFieldProps = Omit<React.ComponentProps<typeof TextInput>, 'style'> & {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  inputRef?: Ref<TextInput>;
  label: string;
  password?: boolean;
};

export function LoginField({
  icon,
  inputRef,
  label,
  password = false,
  ...inputProps
}: LoginFieldProps) {
  const { theme } = useAppearance();
  const [focused, setFocused] = useState(false);
  const [passwordHidden, setPasswordHidden] = useState(password);

  return (
    <View style={styles.group}>
      <Text
        style={[styles.label, { color: focused ? theme.colors.primary : theme.colors.textSubtle }]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: focused ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={focused ? theme.colors.primary : theme.colors.textSubtle}
        />
        <TextInput
          {...inputProps}
          ref={inputRef}
          style={[styles.input, { color: theme.colors.inputText }]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          selectionColor={theme.colors.primary}
          secureTextEntry={password ? passwordHidden : false}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {password ? (
          <Pressable
            onPress={() => setPasswordHidden((current) => !current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={passwordHidden ? 'Show password' : 'Hide password'}
            style={({ pressed }) => [styles.passwordToggle, { opacity: pressed ? 0.55 : 1 }]}
          >
            <Ionicons
              name={passwordHidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.textSubtle}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 7 },
  label: { ...mobileTextStyles.caption1, fontWeight: '700', letterSpacing: 0.3 },
  field: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    paddingLeft: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontSize: 16,
    paddingVertical: 0,
  },
  passwordToggle: {
    minWidth: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
