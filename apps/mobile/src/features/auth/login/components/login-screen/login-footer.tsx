import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Link } from '@mobile/navigation/router-compat';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function LoginFooter() {
  const { theme } = useAppearance();

  return (
    <View style={styles.container}>
      <View style={styles.accountRow}>
        <Text style={[styles.copy, { color: theme.colors.textSubtle }]}>
          First time signing in?
        </Text>
        <Link href="/(auth)/set-password" asChild>
          <Pressable hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.link, { color: theme.colors.secondary }]}>Set your password</Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.secureRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.textSubtle} />
        <Text style={[styles.secureText, { color: theme.colors.textSubtle }]}>
          Secure access to your workspace
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: mobileSpacing.md },
  accountRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  copy: { ...mobileTextStyles.footnote },
  link: { ...mobileTextStyles.footnote, fontWeight: '700' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  secureText: { ...mobileTextStyles.caption2 },
});
