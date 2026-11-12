import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import type { ParcelFullDetails } from '@mobile/types/parcels';
import { useParcelOfficeEditor } from '../../hooks';
import { ReceivingOfficeField } from './receiving-office-field';

export function ParcelOfficeEditor({
  parcel,
  onSaved,
}: {
  parcel: ParcelFullDetails['parcel'];
  onSaved: () => void;
}) {
  const { enabled, office, save, saving } = useParcelOfficeEditor(parcel, onSaved);
  if (!enabled || (!office.options.length && !office.isLoading && !office.isError)) return null;

  return (
    <AppCard>
      <ReceivingOfficeField {...office} disabled={saving} />
      {office.options.length ? (
        <AppButton
          title={saving ? 'Saving…' : 'Save office'}
          variant="secondary"
          disabled={saving || !office.officeId || office.officeId === parcel.receivingOfficeId}
          onPress={() => void save()}
        />
      ) : null}
    </AppCard>
  );
}
