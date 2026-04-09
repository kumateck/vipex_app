import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
} from '../api/fleet-transport.api';

export function FleetDriverTrainingRecordCreatePage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const [createRecord, { isLoading }] = useCreateFleetDriverComplianceRecordMutation();

  const onSubmit = async () => {
    if (!employeeId) {
      toast.error('Select a driver');
      return;
    }
    try {
      await createRecord({
        employeeId,
        complianceType: 1,
        documentNumber: documentNumber.trim() || null,
        issuer: issuer.trim() || null,
        issuedAt: issuedAt ? new Date(issuedAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Training record created');
      navigate('/fleet-transport/drivers/training');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create training record');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Add Driver Training Record</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/training">Back to training records</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
              placeholder="Document number"
            />
            <Input
              value={issuer}
              onChange={(event) => setIssuer(event.target.value)}
              placeholder="Issuer"
            />
            <Input
              type="datetime-local"
              value={issuedAt}
              onChange={(event) => setIssuedAt(event.target.value)}
            />
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note"
            />
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Create training record
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/fleet-transport/drivers/training')}
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
