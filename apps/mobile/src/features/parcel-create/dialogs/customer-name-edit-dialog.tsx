import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, AppLabel } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { useBookingCustomerNameEdit } from '../hooks';

export function CustomerNameEditDialog({
  editor,
  title,
}: {
  editor: ReturnType<typeof useBookingCustomerNameEdit>;
  title: string;
}) {
  const { theme } = useAppearance();
  return (
    <Modal visible={editor.open} transparent animationType="slide" onRequestClose={editor.close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <AppCard>
            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>
              Edit {title.toLowerCase()} customer
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              {editor.telephone}
              {editor.telephone2 ? ` / ${editor.telephone2}` : ''}
            </Text>
            <AppLabel>Customer name</AppLabel>
            <AppInput
              value={editor.fullname}
              onChangeText={editor.setFullname}
              maxLength={255}
              editable={!editor.saving}
              autoFocus
            />
            <Text style={{ color: theme.colors.textMuted }}>
              The existing customer is updated. Their telephone numbers stay the same.
            </Text>
            <View style={{ gap: 10 }}>
              <AppButton
                title="Save changes"
                onPress={() => void editor.save()}
                loading={editor.saving}
                disabled={editor.saving || !editor.fullname.trim()}
              />
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={editor.close}
                disabled={editor.saving}
              />
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
