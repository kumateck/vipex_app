import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function QueueEmptyState({ icon, message }: { icon: string; message: string }) {
  const { theme } = useAppearance();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.cardMuted }]}>
      <View style={[styles.icon, { backgroundColor: theme.colors.card }]}>
        <Ionicons name={icon} size={19} color={theme.colors.textSubtle} />
      </View>
      <Text style={[styles.message, { color: theme.colors.textSubtle }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: mobileRadius.md, padding: mobileSpacing.md, alignItems: 'center', gap: 8 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  message: { ...mobileTextStyles.footnote, textAlign: 'center' },
});
