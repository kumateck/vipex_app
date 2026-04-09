import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetVehicleQuery,
  useListFleetVehicleDocumentsQuery,
} from '../../api/fleet-transport.api';

function ownershipTypeLabel(value: number) {
  if (value === 0) return 'Company Owned';
  if (value === 1) return 'Leased';
  if (value === 2) return 'Third Party';
  return 'Unknown';
}

function fuelTypeLabel(value: number) {
  if (value === 0) return 'Petrol';
  if (value === 1) return 'Diesel';
  if (value === 2) return 'Electric';
  if (value === 3) return 'Hybrid';
  if (value === 4) return 'Gas';
  if (value === 5) return 'Other';
  return 'Unknown';
}

function lifecycleStatusLabel(value: number) {
  if (value === 0) return 'Active';
  if (value === 1) return 'In Maintenance';
  if (value === 2) return 'Retired';
  if (value === 3) return 'Decommissioned';
  return 'Unknown';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function dueBadgeText(value: string | null | undefined) {
  if (!value) return 'No expiry';
  const dueAt = new Date(value).getTime();
  if (Number.isNaN(dueAt)) return 'Invalid date';
  const now = Date.now();
  const diffDays = Math.ceil((dueAt - now) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return `Due in ${diffDays} day(s)`;
  return 'Valid';
}

export function FleetVehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id ?? '';

  const { data: vehicle, isLoading: loadingVehicle } = useGetFleetVehicleQuery(vehicleId, {
    skip: !vehicleId,
  });
  const { data: documents = [], isLoading: loadingDocuments } = useListFleetVehicleDocumentsQuery(
    { vehicleId },
    { skip: !vehicleId },
  );

  const documentTimeline = useMemo(() => {
    return [...documents].sort((a, b) => {
      const aAt = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bAt = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aAt - bAt;
    });
  }, [documents]);

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Vehicle Detail: {vehicle?.plateNumber ?? vehicleId}</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/vehicles">Back</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/fleet-transport/vehicles/edit/${vehicleId}`}>Edit</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/fleet-transport/vehicles/view/${vehicleId}/documents`}>Documents</Link>
              </Button>
              <Button asChild>
                <Link to={`/fleet-transport/vehicles/view/${vehicleId}/documents/new`}>
                  Add Document
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingVehicle ? <p>Loading vehicle...</p> : null}
            {!loadingVehicle && !vehicle ? (
              <p className="text-sm text-muted-foreground">Vehicle not found.</p>
            ) : null}

            {vehicle ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Plate Number</p>
                    <p className="font-medium">{vehicle.plateNumber}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{vehicle.model}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{vehicle.year ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-medium">{vehicle.vin ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Ownership</p>
                    <p className="font-medium">{ownershipTypeLabel(vehicle.ownershipType)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Lessor</p>
                    <p className="font-medium">{vehicle.lessorName ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Lease Window</p>
                    <p className="font-medium">
                      {formatDateTime(vehicle.leaseStartAt)} - {formatDateTime(vehicle.leaseEndAt)}
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Lifecycle Status</p>
                    <p className="font-medium">{lifecycleStatusLabel(vehicle.lifecycleStatus)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{fuelTypeLabel(vehicle.fuelType)}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Expected KM/L</p>
                    <p className="font-medium">{vehicle.expectedKmPerLiter ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Tank Capacity (L)</p>
                    <p className="font-medium">{vehicle.tankCapacityLiters ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Payload (kg)</p>
                    <p className="font-medium">{vehicle.payloadCapacityKg ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Cargo (cbm)</p>
                    <p className="font-medium">{vehicle.cargoCapacityCbm ?? '-'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Insurance</p>
                    <p className="font-medium">
                      {formatDateTime(vehicle.insuranceExpiryAt)} (
                      {dueBadgeText(vehicle.insuranceExpiryAt)})
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-sm text-muted-foreground">Roadworthy</p>
                    <p className="font-medium">
                      {formatDateTime(vehicle.roadworthyExpiryAt)} (
                      {dueBadgeText(vehicle.roadworthyExpiryAt)})
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documents Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loadingDocuments ? <p>Loading documents...</p> : null}
                    {!loadingDocuments && documentTimeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No vehicle documents found.</p>
                    ) : null}
                    {documentTimeline.map((doc) => (
                      <div key={doc.id} className="rounded border p-3">
                        <p className="font-medium">{doc.documentType}</p>
                        <p className="text-sm text-muted-foreground">
                          Number: {doc.documentNumber ?? '-'} | Issuer: {doc.issuer ?? '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Issued: {formatDateTime(doc.issuedAt)} | Expires:{' '}
                          {formatDateTime(doc.expiresAt)} ({dueBadgeText(doc.expiresAt)})
                        </p>
                        {doc.fileUrl ? (
                          <p className="text-sm">
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
                        {doc.note ? <p className="text-sm">{doc.note}</p> : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
