import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateFleetVehicleDocumentMutation,
  useGetFleetVehicleQuery,
} from '../../api/fleet-transport.api';

export function FleetVehicleDocumentsCreatePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: vehicle } = useGetFleetVehicleQuery(id, { skip: !id });
  const [createVehicleDocument, { isLoading }] = useCreateFleetVehicleDocumentMutation();

  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docIssuer, setDocIssuer] = useState('');
  const [docIssuedAt, setDocIssuedAt] = useState('');
  const [docExpiresAt, setDocExpiresAt] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docNote, setDocNote] = useState('');

  const onSubmit = async () => {
    if (!id) return;
    if (!docType.trim()) {
      toast.error('Document type is required');
      return;
    }

    try {
      await createVehicleDocument({
        vehicleId: id,
        documentType: docType.trim(),
        documentNumber: docNumber.trim() || null,
        issuer: docIssuer.trim() || null,
        issuedAt: docIssuedAt ? new Date(docIssuedAt).toISOString() : null,
        expiresAt: docExpiresAt ? new Date(docExpiresAt).toISOString() : null,
        fileUrl: docFileUrl.trim() || null,
        note: docNote.trim() || null,
      }).unwrap();
      toast.success('Document added');
      navigate(`/fleet-transport/vehicles/view/${id}/documents`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to add document');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Add Vehicle Document: {vehicle?.plateNumber ?? id}</CardTitle>
            <Button asChild variant="outline">
              <Link to={`/fleet-transport/vehicles/view/${id}/documents`}>Back to documents</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Document type</FieldLabel>
                <Input value={docType} onChange={(e) => setDocType(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Document number</FieldLabel>
                <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Issuer</FieldLabel>
                <Input value={docIssuer} onChange={(e) => setDocIssuer(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Issued At</FieldLabel>
                <DateTimePicker
                  value={docIssuedAt ? new Date(docIssuedAt) : undefined}
                  onChange={(value) => setDocIssuedAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>Expires At</FieldLabel>
                <DateTimePicker
                  value={docExpiresAt ? new Date(docExpiresAt) : undefined}
                  onChange={(value) => setDocExpiresAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>File URL</FieldLabel>
                <Input value={docFileUrl} onChange={(e) => setDocFileUrl(e.target.value)} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <Input value={docNote} onChange={(e) => setDocNote(e.target.value)} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save document
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/fleet-transport/vehicles/view/${id}/documents`)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
