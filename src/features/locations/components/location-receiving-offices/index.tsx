import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <OfficeNameForm
            key={office.id}
            name={office.name}
            onSave={(name) => save(name, office.id)}
          />
        ))}
        {data ? <OfficeNameForm onSave={save} /> : null}
      </CardContent>
    </Card>
  );
}
