import { Button } from '@/components/ui/button';
import { useParcelReceivingOffice, type ParcelOfficeEditorInput } from '../../hooks';
import { ReceivingOfficeField } from './receiving-office-field';

export function ParcelOfficeEditor({ parcel }: { parcel: ParcelOfficeEditorInput }) {
  const { canEdit, choice, save, saving } = useParcelReceivingOffice(parcel);
  if (!canEdit || (!choice.options.length && !choice.isLoading && !choice.isError)) return null;

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
      <ReceivingOfficeField {...choice} disabled={saving} />
      {choice.options.length ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void save()}
          disabled={saving || !choice.officeId || choice.officeId === parcel.receivingOfficeId}
        >
          {saving ? 'Saving…' : 'Save office'}
        </Button>
      ) : null}
    </div>
  );
}
