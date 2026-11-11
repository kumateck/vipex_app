import { useState } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useGetParcelHandoverNoteQuery, useSaveParcelHandoverNoteMutation } from '../services';

export function useHandoverNoteDialog(
  parcelId: string,
  { allowEdit, adding, onSaved }: { allowEdit: boolean; adding: boolean; onSaved: () => void },
) {
  const query = useGetParcelHandoverNoteQuery(parcelId, { refetchOnMountOrArgChange: true });
  const [saveNote, { isLoading: saving }] = useSaveParcelHandoverNoteMutation();
  const [input, setDraft] = useState<{ text: string; original: string | null }>();
  const [saveError, setSaveError] = useState('');
  const note = query.currentData;
  const canEdit = allowEdit && note?.canEdit;
  const draft =
    canEdit && adding && note.note === null ? (input ?? { text: '', original: null }) : input;
  return {
    note,
    draft,
    saving,
    loading: query.isLoading,
    error: query.isError ? getErrorMessage(query.error) : '',
    saveError,
    retry: query.refetch,
    edit: () => {
      if (canEdit) setDraft({ text: note.note ?? '', original: note.note });
    },
    change: (text: string) => {
      if (draft) setDraft({ ...draft, text });
    },
    cancel: () => {
      setDraft(undefined);
      setSaveError('');
    },
    save: async () => {
      if (!canEdit || !draft?.text.trim() || saving) return;
      setSaveError('');
      try {
        await saveNote({
          id: parcelId,
          note: draft.text.trim(),
          expectedNote: draft.original,
        }).unwrap();
        onSaved();
      } catch (error) {
        setSaveError(getErrorMessage(error, 'Unable to save the handover note'));
      }
    },
  };
}
