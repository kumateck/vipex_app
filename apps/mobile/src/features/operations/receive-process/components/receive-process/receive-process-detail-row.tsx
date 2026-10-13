import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { styles } from './receive-process.styles';

export function DetailRow({
  label,
  value,
  first,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.detailRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}
