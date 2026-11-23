import { AppButton } from '@mobile/components/ui/mobile';
import { useParcelInformationEditor } from '../../hooks';
import { ParcelInformationEditorDialog } from '../../dialogs';
import type { ParcelInformationActionProps } from '../../types';

export function ParcelInformationEditAction(props: ParcelInformationActionProps) {
  const editor = useParcelInformationEditor(props);
  if (!editor.canEdit && !editor.open) return null;
  return (
    <>
      {editor.canEdit ? (
        <AppButton title="Edit parcel details" variant="secondary" onPress={editor.begin} />
      ) : null}
      {editor.open ? <ParcelInformationEditorDialog editor={editor} /> : null}
    </>
  );
}
