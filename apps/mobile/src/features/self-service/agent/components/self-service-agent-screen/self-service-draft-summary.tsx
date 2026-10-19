import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import type { SelfServiceDraft, UpdateSelfServiceDraftInput } from '../../types';
import { SelfServiceDraftEditor } from './self-service-draft-editor';

type Props = {
  draft: SelfServiceDraft;
  saving: boolean;
  canEdit: boolean;
  onUpdateDraft: (input: UpdateSelfServiceDraftInput) => Promise<boolean>;
};

export function SelfServiceDraftSummary({ draft, saving, canEdit, onUpdateDraft }: Props) {
  const { theme } = useAppearance();
  const [editing, setEditing] = useState(false);
  const muted = [styles.text, { color: theme.colors.textMuted }];

  if (editing)
    return (
      <SelfServiceDraftEditor
        key={`${draft.id}:${draft.updatedAt}`}
        draft={draft}
        saving={saving}
        onSave={onUpdateDraft}
        onClose={() => setEditing(false)}
      />
    );

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Complete booking</Text>
      <Text style={muted}>
        Sender: {draft.senderFullname} · {draft.senderPhone}
        {draft.senderPhone2 ? ` / ${draft.senderPhone2}` : ''}
      </Text>
      <Text style={muted}>
        Receiver: {draft.receiverFullname} · {draft.receiverPhone}
        {draft.receiverPhone2 ? ` / ${draft.receiverPhone2}` : ''}
      </Text>
      <Text style={muted}>Contents: {draft.parcelContent}</Text>
      <Text style={muted}>Declared value: GHS {(draft.parcelValuePsw / 100).toFixed(2)}</Text>
      {canEdit ? (
        <AppButton
          title="Edit booking details"
          variant="secondary"
          disabled={saving}
          onPress={() => setEditing(true)}
        />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  text: { ...mobileTextStyles.subhead },
});
