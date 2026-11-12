import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OfficeNameForm({
  name,
  onSave,
}: {
  name?: string;
  onSave: (name: string) => Promise<boolean>;
}) {
  const id = useId();
  const [draft, setDraft] = useState(name ?? '');
  const [saving, setSaving] = useState(false);
  const cleanName = draft.trim();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!cleanName || saving || cleanName === name) return;
        setSaving(true);
        try {
          if (await onSave(cleanName)) setDraft(name === undefined ? '' : cleanName);
        } finally {
          setSaving(false);
        }
      }}
    >
      <label htmlFor={id} className="sr-only">
        {name ? `Name for ${name}` : 'New office name'}
      </label>
      <Input
        id={id}
        value={draft}
        maxLength={255}
        required
        disabled={saving}
        placeholder="New office name"
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button
        type="submit"
        variant={name ? 'outline' : 'default'}
        disabled={saving || !cleanName || cleanName === name}
      >
        {name ? 'Rename' : 'Add office'}
      </Button>
    </form>
  );
}
