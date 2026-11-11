import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCorrectionEditor } from '../../hooks';
import type { CorrectionMode, CorrectionParcel, CorrectionParty } from '../../types';
import { CustomerMatchFields } from '../customer-match-fields';

type Props = {
  parcel: CorrectionParcel;
  party: CorrectionParty;
  onSaved: (parcel: CorrectionParcel) => void;
};

export function CorrectionEditor({ parcel, party, onSaved }: Props) {
  const editor = useCorrectionEditor(parcel, party, onSaved);
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void editor.save();
      }}
    >
      <fieldset className="min-w-0 space-y-5" disabled={editor.isSaving}>
        <div className="space-y-2">
          <Label htmlFor="correction-mode">Correction</Label>
          <Select
            value={editor.mode}
            onValueChange={(value) => editor.setMode(value as CorrectionMode)}
          >
            <SelectTrigger id="correction-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editor.canEdit ? (
                <SelectItem value="profile">Correct name and telephone</SelectItem>
              ) : null}
              {editor.canRelink ? (
                <SelectItem value="relink">Link existing customer</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        {editor.mode === 'profile' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="correction-name">Customer name</Label>
              <Input
                id="correction-name"
                value={editor.fullname}
                maxLength={255}
                required
                onChange={(event) => editor.setFullname(event.target.value)}
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  checked={editor.updateName}
                  onChange={(event) => editor.setUpdateName(event.target.checked)}
                />
                Save this name on the parcel and customer profile
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="correction-phone">Primary telephone</Label>
                <Input
                  id="correction-phone"
                  value={editor.telephone}
                  inputMode="tel"
                  maxLength={10}
                  required
                  pattern="[0-9]{10}"
                  onChange={(event) => editor.setTelephone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correction-phone2">Secondary telephone (optional)</Label>
                <Input
                  id="correction-phone2"
                  value={editor.telephone2}
                  inputMode="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  onChange={(event) => editor.setTelephone2(event.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A selected name correction updates this parcel and the customer profile. Telephone
              changes apply to every parcel linked to this customer. Existing pickup codes and
              pending signatures for this customer will require fresh verification.
            </p>
          </>
        ) : (
          <CustomerMatchFields editor={editor} />
        )}
        {editor.mode === 'relink' && party === 'receiver' ? (
          <p className="text-sm text-muted-foreground">
            Linking a new main receiver clears previous receiver ID-card details, the second
            receiver, pending signatures and pickup verification.
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="correction-reason">Reason for correction</Label>
          <Textarea
            id="correction-reason"
            value={editor.reason}
            minLength={5}
            maxLength={1000}
            required
            placeholder="Explain why these customer details need correcting"
            onChange={(event) => editor.setReason(event.target.value)}
          />
        </div>
      </fieldset>
      {editor.error ? (
        <p role="alert" className="text-sm text-destructive">
          {editor.error}
        </p>
      ) : null}
      <Button type="submit" disabled={!editor.canSave || editor.isSaving || editor.isFetching}>
        {editor.isSaving ? 'Saving correction…' : 'Save correction'}
      </Button>
    </form>
  );
}
