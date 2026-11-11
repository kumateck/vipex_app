import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { getHandoverNote, saveHandoverNote } from '../services';
import type { ParcelHandoverNote } from '../types';
export { useNoteQueue } from './use-note-queue';

export function useHandoverNoteDialog(
  id: string,
  { allowEdit, adding, onSaved }: { allowEdit: boolean; adding: boolean; onSaved: () => void },
) {
  const { withAuth } = useAuth();
  const [note, setNote] = useState<ParcelHandoverNote>();
  const [input, setDraft] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await withAuth((token) => getHandoverNote(token, id));
      if (generation.current === request) setNote(result);
    } catch (failure) {
      if (generation.current === request)
        setError(getMobileErrorMessage(failure, 'Unable to load the handover note'));
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }, [id, withAuth]);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  const canEdit = allowEdit && note?.canEdit;
  const draft = canEdit && adding && note.note === null ? (input ?? '') : input;
  const save = async () => {
    if (!draft?.trim() || !canEdit || saving) return;
    setSaving(true);
    setError('');
    try {
      await withAuth((token) =>
        saveHandoverNote(token, id, { note: draft.trim(), expectedNote: note.note }),
      );
      onSaved();
    } catch (failure) {
      setError(getMobileErrorMessage(failure, 'Unable to save the handover note'));
    } finally {
      setSaving(false);
    }
  };
  return { note, draft, setDraft, loading, saving, error, reload, save };
}
