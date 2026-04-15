import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetVehicleQuery,
  useListFleetVehicleDocumentsQuery,
} from '../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetVehicleDocumentsListPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: vehicle } = useGetFleetVehicleQuery(id, { skip: !id });
  const { data: documents = [], isLoading } = useListFleetVehicleDocumentsQuery(
    { vehicleId: id },
    { skip: !id },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Vehicle Documents: {vehicle?.plateNumber ?? id}</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/fleet-transport/vehicles/view/${id}`}>Back to vehicle</Link>
              </Button>
              <Button asChild>
                <Link to={`/fleet-transport/vehicles/view/${id}/documents/new`}>Add document</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            ) : null}
            {!isLoading && documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents found.</p>
            ) : null}
            {documents.map((doc) => (
              <div key={doc.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{doc.documentType}</p>
                <p className="text-muted-foreground">
                  Number: {doc.documentNumber ?? '-'} | Issuer: {doc.issuer ?? '-'}
                </p>
                <p className="text-muted-foreground">
                  Issued: {formatDateTime(doc.issuedAt)} | Expires: {formatDateTime(doc.expiresAt)}
                </p>
                {doc.fileUrl ? (
                  <p>
                    <a
                      className="text-primary underline"
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open file
                    </a>
                  </p>
                ) : null}
                {doc.note ? <p>{doc.note}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
