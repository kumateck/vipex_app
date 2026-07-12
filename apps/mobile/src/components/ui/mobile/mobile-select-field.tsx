import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export type AppSelectOption = { value: string; label: string };

type AppSelectFieldProps = {
  label: string;
  value: string;
  options: AppSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
};

export function AppSelectField({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled,
  loading,
}: AppSelectFieldProps) {
  const { theme } = useAppearance();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.inputBg,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            { color: selectedLabel ? theme.colors.inputText : theme.colors.inputPlaceholder },
          ]}
        >
          {loading ? 'Loading...' : (selectedLabel ?? placeholder)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textSubtle} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[styles.sheet, mobileShadow.modal, { backgroundColor: theme.colors.bgElevated }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label}</Text>
              <Pressable onPress={close} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.colors.textSubtle} />
              </Pressable>
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.colors.inputPlaceholder}
              style={[
                styles.searchInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBg,
                  color: theme.colors.inputText,
                },
              ]}
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.colors.textSubtle }]}>
                  No matches found.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onValueChange(item.value);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: pressed ? theme.colors.cardMuted : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...mobileTextStyles.eyebrow, textTransform: 'uppercase' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 13,
  },
  triggerText: { fontSize: 16, flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: mobileRadius.xl,
    borderTopRightRadius: mobileRadius.xl,
    padding: mobileSpacing.lg,
    maxHeight: '75%',
    gap: mobileSpacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { ...mobileTextStyles.headline },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 11,
    fontSize: 15,
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: mobileSpacing.xs,
    borderRadius: mobileRadius.sm,
  },
  optionText: { ...mobileTextStyles.body, flex: 1 },
  emptyText: {
    ...mobileTextStyles.subhead,
    textAlign: 'center',
    paddingVertical: mobileSpacing.lg,
  },
});
