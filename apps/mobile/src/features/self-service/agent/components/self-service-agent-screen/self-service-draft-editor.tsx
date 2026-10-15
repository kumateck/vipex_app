import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { useSelfServiceDraftEditor } from '../../hooks';
import type { SelfServiceDraft, UpdateSelfServiceDraftInput } from '../../types';
import { SelfServiceContactFields } from './self-service-contact-fields';
import { SelfServiceParcelFields } from './self-service-parcel-fields';

type Props = {
  draft: SelfServiceDraft;
  saving: boolean;
  onSave: (input: UpdateSelfServiceDraftInput) => Promise<boolean>;
  onClose: () => void;
};

export function SelfServiceDraftEditor({ draft, saving, onSave, onClose }: Props) {
  const { theme } = useAppearance();
  const editor = useSelfServiceDraftEditor(draft, onSave, onClose);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Edit booking details</Text>
      <Text style={[styles.text, { color: theme.colors.textMuted }]}>
        Correct anything the customer entered. Changing a saved customer&apos;s record needs
        customer update permission.
      </Text>
      <SelfServiceContactFields
        title="Sender"
        contact={editor.contacts.sender}
        error={editor.errors.sender}
        onChange={(field, value) => editor.onContactChange('sender', field, value)}
      />
      <SelfServiceContactFields
        title="Receiver"
        contact={editor.contacts.receiver}
        error={editor.errors.receiver}
        onChange={(field, value) => editor.onContactChange('receiver', field, value)}
      />
      <SelfServiceParcelFields
        destination={editor.destination}
        parcel={editor.parcel}
        error={editor.errors.parcel}
      />
      <View style={styles.actions}>
        <AppButton
          title="Save booking details"
          loading={saving}
          disabled={!editor.valid}
          onPress={() => void editor.save()}
        />
        <AppButton title="Cancel" variant="plain" disabled={saving} onPress={onClose} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.subhead },
  actions: { gap: mobileSpacing.xs },
});
