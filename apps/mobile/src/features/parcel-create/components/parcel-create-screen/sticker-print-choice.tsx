import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { mobileSpacing } from '@mobile/theme/layout';

export function StickerPrintChoice({
  value,
  onChange,
  copies,
  onCopiesChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  copies: string;
  onCopiesChange: (value: string) => void;
}) {
  const { theme } = useAppearance();
  return (
    <>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={styles.row}
      >
        <Ionicons
          name={value ? 'checkbox' : 'square-outline'}
          size={25}
          color={theme.colors.primary}
        />
        <View style={styles.copy}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
            Complete & print sticker
          </Text>
          <Text style={{ color: theme.colors.textSubtle }}>
            Requires an active sender cashier session or permission from that cashier. Opens the
            phone print dialog.
          </Text>
        </View>
      </Pressable>
      {value ? (
        <>
          <AppLabel>Sticker copies</AppLabel>
          <AppInput
            value={copies}
            onChangeText={onCopiesChange}
            keyboardType="number-pad"
            placeholder="1"
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: mobileSpacing.sm,
    alignItems: 'flex-start',
    paddingVertical: mobileSpacing.sm,
  },
  copy: { flex: 1, gap: 4 },
});
