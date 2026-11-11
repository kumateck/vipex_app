import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useCorrectionEditor } from '../../hooks';

export function CustomerMatchFields({
  editor,
}: {
  editor: ReturnType<typeof useCorrectionEditor>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="replacement-phone">Correct customer telephone</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="replacement-phone"
            inputMode="tel"
            autoComplete="off"
            value={editor.lookupPhone}
            maxLength={10}
            onChange={(event) => editor.changeLookupPhone(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={editor.lookup}
            disabled={editor.lookupPhone.length !== 10 || editor.isFetching}
          >
            {editor.isFetching ? 'Looking up…' : 'Find customer'}
          </Button>
        </div>
      </div>
      {editor.matches ? (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Select the correct customer</legend>
          {editor.matches.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground">
              No existing customer matches this number. Use Correct name and telephone to update the
              current customer.
            </p>
          ) : (
            editor.matches.map((row) => (
              <label
                key={row.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm"
              >
                <input
                  type="radio"
                  name="replacement-customer"
                  value={row.id}
                  className="mt-1 accent-primary"
                  checked={row.id === editor.selectedId}
                  disabled={row.id === editor.customer.id}
                  onChange={() => editor.setSelectedId(row.id)}
                />
                <span className="min-w-0 break-words">
                  <span className="block font-medium">{row.fullname}</span>
                  <span className="text-muted-foreground">
                    {row.telephone || 'No primary phone'}
                    {row.telephone2 ? ` / ${row.telephone2}` : ''}
                  </span>
                  {row.id === editor.customer.id ? (
                    <span className="block">Already linked to this parcel</span>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </fieldset>
      ) : null}
      {editor.selected ? (
        <p role="status" className="text-sm">
          Primary telephone after linking will be{' '}
          <strong>{editor.selected.telephone || 'unavailable'}</strong>. For the main receiver, this
          is the default pickup OTP destination.
        </p>
      ) : null}
    </div>
  );
}
