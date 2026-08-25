import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

export function AssignedDeliveriesSearch(props: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <Ionicons name="search-outline" size={21} color={theme.colors.textSubtle} />
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder="Search booking, receiver or address"
        placeholderTextColor={theme.colors.inputPlaceholder}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: theme.colors.inputText }]}
      />
      {props.value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={props.onClear}
        >
          <Ionicons name="close-circle" size={21} color={theme.colors.textSubtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    borderRadius: mobileRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpacing.md,
  },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 12 },
});
