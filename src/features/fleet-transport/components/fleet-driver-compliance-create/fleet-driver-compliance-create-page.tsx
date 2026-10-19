import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetDriverComplianceRecordMutation,
  useListFleetDriverOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetDriverComplianceCreatePage() {
  const navigate = useNavigate();
  const { data: driverOptions = [] } = useListFleetDriverOptionsQuery();
  const [createRecord, { isLoading: saving }] = useCreateFleetDriverComplianceRecordMutation();

  const [employeeId, setEmployeeId] = useState('');
  const [complianceType, setComplianceType] = useState('0');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [note, setNote] = useState('');

  const onCreate = async () => {
    if (!employeeId) {
      toast.error('Select a driver first');
      return;
    }

    try {
      await createRecord({
        employeeId,
        complianceType: Number(complianceType),
        documentNumber: documentNumber.trim() || null,
        issuer: issuer.trim() || null,
        issuedAt: issuedAt ? new Date(issuedAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        fileUrl: fileUrl.trim() || null,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Compliance record added');
      navigate('/fleet-transport/drivers/compliance');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to add record');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Add Driver Compliance Record</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/compliance">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {driverOptions.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid gap-3 md:grid-cols-2">
              <Select value={complianceType} onValueChange={setComplianceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Compliance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">License</SelectItem>
                  <SelectItem value="1">Training</SelectItem>
                  <SelectItem value="2">Medical</SelectItem>
                  <SelectItem value="3">Background Check</SelectItem>
                  <SelectItem value="4">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Document number"
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
              />
              <Input
                placeholder="Issuer"
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
              />
              <DateTimePicker
                value={issuedAt ? new Date(issuedAt) : undefined}
                onChange={(value) => setIssuedAt(value ? value.toISOString() : '')}
                placeholder="Issued at"
              />
              <DateTimePicker
                value={expiresAt ? new Date(expiresAt) : undefined}
                onChange={(value) => setExpiresAt(value ? value.toISOString() : '')}
                placeholder="Expires at"
              />
              <Input
                placeholder="File URL"
                value={fileUrl}
                onChange={(event) => setFileUrl(event.target.value)}
              />
            </div>
            <Input
              placeholder="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving || !employeeId}>
                Add compliance record
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/fleet-transport/drivers/compliance')}
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
