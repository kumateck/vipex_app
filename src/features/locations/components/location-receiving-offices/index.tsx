import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteOfficeDialog } from '../../dialogs';
import { useLocationReceivingOffices } from '../../hooks';
import { OfficeNameForm } from './office-name-form';

export function LocationReceivingOffices({ locationId }: { locationId: string }) {
  const { data, isLoading, isError, save } = useLocationReceivingOffices(locationId);

  return (
    <Card className="mx-auto mt-4 w-full max-w-lg">
      <CardHeader>
        <CardTitle>Receiving offices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p role="status">Loading receiving offices…</p> : null}
        {isError ? <p role="alert">Could not load receiving offices.</p> : null}
        {data?.map((office) => (
          <div key={office.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <OfficeNameForm name={office.name} onSave={(name) => save(name, office.id)} />
            </div>
            <DeleteOfficeDialog
              locationId={locationId}
              officeId={office.id}
              officeName={office.name}
            />
          </div>
        ))}
        {data ? <OfficeNameForm onSave={save} /> : null}
      </CardContent>
    </Card>
  );
}
