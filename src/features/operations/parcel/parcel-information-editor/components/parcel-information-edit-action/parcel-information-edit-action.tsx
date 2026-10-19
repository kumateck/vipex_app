import { Button } from '@/components/ui/button';
import type { EditableParcelInformation } from '../../types';
import { useParcelInformationEditor } from '../../hooks';
import { ParcelInformationEditorDialog } from '../../dialogs';

export function ParcelInformationEditAction({ parcel }: { parcel: EditableParcelInformation }) {
  const editor = useParcelInformationEditor(parcel);
  if (!editor.canEdit) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={editor.begin}>
        Edit
      </Button>
      <ParcelInformationEditorDialog editor={editor} bookingCode={parcel.bookingCode} />
    </>
  );
}
