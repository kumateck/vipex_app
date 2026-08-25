import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Props = {
  query: string;
  busy: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
};

export function ParcelSearchForm({ query, busy, onChange, onClear, onSubmit }: Props) {
  const { theme } = useAppearance();
  const disabled = query.trim().length === 0 || busy;

  return (
    <View style={[styles.card, mobileShadow.card, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Search records</Text>
      <Text style={[styles.help, { color: theme.colors.textMuted }]}>
        Start with any detail you know.
      </Text>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={21} color={theme.colors.textSubtle} />
        <TextInput
          value={query}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder="Booking code, name or phone"
          placeholderTextColor={theme.colors.inputPlaceholder}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: theme.colors.inputText }]}
          accessibilityLabel="Parcel search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={21} color={theme.colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={busy ? 'Searching parcel records' : 'Search parcel records'}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            opacity: disabled ? 0.48 : pressed ? 0.84 : 1,
          },
        ]}
      >
        <Ionicons
          name={busy ? 'hourglass-outline' : 'sparkles-outline'}
          size={18}
          color={theme.colors.primaryText}
        />
        <Text style={[styles.buttonText, { color: theme.colors.primaryText }]}>
          {busy ? 'Searching…' : 'Search parcels'}
        </Text>
        {!busy ? (
          <Ionicons name="arrow-forward" size={18} color={theme.colors.primaryText} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: mobileRadius.xl, padding: mobileSpacing.lg, gap: mobileSpacing.sm },
  label: { ...mobileTextStyles.headline },
  help: { ...mobileTextStyles.caption1, marginTop: -4 },
  inputWrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    borderRadius: mobileRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpacing.md,
    marginTop: mobileSpacing.xs,
  },
  input: { ...mobileTextStyles.body, flex: 1, minWidth: 0, paddingVertical: mobileSpacing.md },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.sm,
    borderRadius: mobileRadius.lg,
    marginTop: mobileSpacing.xs,
  },
  buttonText: { ...mobileTextStyles.headline },
});
