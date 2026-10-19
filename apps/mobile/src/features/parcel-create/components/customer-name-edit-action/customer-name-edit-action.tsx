import { Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { UseCustomerLookupResult } from '../../use-customer-lookup';
import { useBookingCustomerNameEdit } from '../../hooks';
import { CustomerNameEditDialog } from '../../dialogs';

export function CustomerNameEditAction({
  title,
  lookup,
}: {
  title: string;
  lookup: UseCustomerLookupResult;
}) {
  const { theme } = useAppearance();
  const editor = useBookingCustomerNameEdit(lookup);
  if (!editor.visible) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title.toLowerCase()} customer name`}
        onPress={editor.begin}
        disabled={lookup.isLookingUp}
        style={{ padding: 10 }}
      >
        <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
      </Pressable>
      <CustomerNameEditDialog editor={editor} title={title} />
    </>
  );
}
