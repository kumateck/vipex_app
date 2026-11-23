import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton, AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { useParcelInformationEditor } from '../hooks';

export function ParcelInformationEditorDialog({
  editor,
}: {
  editor: ReturnType<typeof useParcelInformationEditor>;
}) {
  const { theme } = useAppearance();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={editor.close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.colors.bgElevated }]}
        >
          <Text
            accessibilityRole="header"
            style={[mobileTextStyles.title3, { color: theme.colors.text }]}
          >
            Edit parcel details
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.fields}>
            <Text style={{ color: theme.colors.textMuted }}>Booking {editor.bookingCode}</Text>
            <AppLabel>Parcel details</AppLabel>
            <AppInput
              accessibilityLabel="Parcel details"
              value={editor.parcelDetails}
              onChangeText={editor.setParcelDetails}
              maxLength={255}
              editable={!editor.saving}
              multiline
            />
            <AppLabel>Receiver name</AppLabel>
            <AppInput
              accessibilityLabel="Receiver name"
              value={editor.receiverName}
              onChangeText={editor.setReceiverName}
              maxLength={255}
              editable={editor.canEditReceiver && !editor.saving}
            />
            <Text style={{ color: theme.colors.textMuted }}>
              {!editor.receiverAvailable
                ? 'Receiver details could not be loaded. Reload the parcel to edit the receiver.'
                : !editor.canEditReceiver
                  ? 'Update Customers permission is required to edit the receiver name.'
                  : 'The receiver name updates on this parcel and the linked customer. Other parcels keep their recorded names.'}
            </Text>
            {editor.error ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={{ color: theme.colors.danger }}
              >
                {editor.error}
              </Text>
            ) : null}
          </ScrollView>
          <AppButton
            title="Save changes"
            onPress={() => void editor.save()}
            loading={editor.saving}
            disabled={editor.saving || !editor.canEdit}
          />
          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={editor.close}
            disabled={editor.saving}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: mobileSpacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '90%',
    padding: mobileSpacing.lg,
    gap: mobileSpacing.sm,
    borderRadius: mobileRadius.lg,
  },
  fields: { gap: mobileSpacing.sm, paddingBottom: mobileSpacing.sm },
});
