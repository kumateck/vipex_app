import { AppButton, AppCard, AppLabel } from '@mobile/components/ui/mobile';
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
  const { assignment, office, save, saving } = useParcelOfficeEditor(parcel, onSaved);
  if (!assignment) return null;

  return (
    <AppCard>
      {assignment.historical ? (
        <AppLabel>Recorded receiving office: {parcel.recordedReceivingOfficeName}</AppLabel>
      ) : null}
      <ReceivingOfficeField {...office} disabled={saving} />
      {office.options.length ? (
        <AppButton
          title={saving ? 'Saving…' : 'Save office'}
          variant="secondary"
          disabled={
            saving || office.isError || !office.officeId || office.officeId === assignment.officeId
          }
          onPress={() => void save()}
        />
      ) : null}
      {!office.options.length && !office.isLoading && !office.isError ? (
        <AppLabel>No receiving offices at this pickup location.</AppLabel>
      ) : null}
    </AppCard>
  );
}
