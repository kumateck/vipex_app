import { Button } from '@/components/ui/button';
import { useParcelReceivingOffice, type ParcelOfficeEditorInput } from '../../hooks';
import { ReceivingOfficeField } from './receiving-office-field';

export function ParcelOfficeEditor({ parcel }: { parcel: ParcelOfficeEditorInput }) {
  const { assignment, choice, save, saving } = useParcelReceivingOffice(parcel);
  if (!assignment) return null;

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      {assignment.historical ? (
        <p className="text-sm">Recorded receiving office: {parcel.recordedReceivingOfficeName}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <ReceivingOfficeField {...choice} disabled={saving} />
        {choice.options.length ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void save()}
            disabled={
              saving ||
              choice.isError ||
              !choice.officeId ||
              choice.officeId === assignment.officeId
            }
          >
            {saving ? 'Saving…' : 'Save office'}
          </Button>
        ) : null}
        {!choice.options.length && !choice.isLoading && !choice.isError ? (
          <p className="text-sm text-muted-foreground">
            No receiving offices at this pickup location.
          </p>
        ) : null}
      </div>
    </div>
  );
}
