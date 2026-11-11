import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { MAX_PARCEL_HANDOVER_NOTE_LENGTH } from '@/shared/shipments/parcel-handover-note';
import { useHandoverNoteDialog } from '../hooks';

export function ParcelHandoverNoteDialog({
  parcelId,
  allowEdit,
  adding,
  onClose,
  onSaved,
}: {
  parcelId: string;
  allowEdit: boolean;
  adding: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useAppearance();
  const state = useHandoverNoteDialog(parcelId, { allowEdit, adding, onSaved });
  const editing = state.draft !== undefined;
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={state.saving ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.colors.bgElevated }]}
        >
          <Text
            accessibilityRole="header"
            style={[mobileTextStyles.title3, { color: theme.colors.text }]}
          >
            {state.note?.critical ? 'Critical handover note' : 'Parcel handover note'}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.note}>
            {state.loading ? (
              <Text style={{ color: theme.colors.textMuted }}>Loading note…</Text>
            ) : null}
            {editing ? (
              <AppInput
                accessibilityLabel="Handover instructions"
                multiline
                value={state.draft}
                onChangeText={state.setDraft}
                maxLength={MAX_PARCEL_HANDOVER_NOTE_LENGTH}
                editable={!state.saving}
                numberOfLines={5}
              />
            ) : null}
            {state.note && !editing ? (
              <Text selectable style={{ color: theme.colors.text }}>
                {state.note.note ?? 'No handover note has been added.'}
              </Text>
            ) : null}
            {state.error ? (
              <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
                {state.error}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <AppButton
              title="Close"
              variant="secondary"
              onPress={onClose}
              disabled={state.saving}
            />
            {state.error && !state.note ? (
              <AppButton title="Retry" onPress={() => void state.reload()} />
            ) : null}
            {editing ? (
              <AppButton
                title="Save note"
                loading={state.saving}
                disabled={!state.draft?.trim() || state.saving}
                onPress={() => void state.save()}
              />
            ) : null}
            {allowEdit && state.note?.canEdit && !editing ? (
              <AppButton
                title={state.note.note ? 'Edit note' : 'Add critical note'}
                onPress={() => state.setDraft(state.note?.note ?? '')}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: mobileSpacing.md,
    gap: mobileSpacing.md,
    borderRadius: mobileRadius.lg,
  },
  note: { flexGrow: 0 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: mobileSpacing.sm,
  },
});
