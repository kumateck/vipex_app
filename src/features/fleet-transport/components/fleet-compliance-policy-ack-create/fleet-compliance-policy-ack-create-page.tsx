import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useAcknowledgeFleetPolicyMutation,
  useListFleetDriverOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetCompliancePolicyAckCreatePage() {
  const navigate = useNavigate();
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const [ackPolicy, { isLoading: saving }] = useAcknowledgeFleetPolicyMutation();

  const [employeeId, setEmployeeId] = useState('');
  const [policyCode, setPolicyCode] = useState('fleet.safety');
  const [policyVersion, setPolicyVersion] = useState('v1');
  const [status, setStatus] = useState('0');
  const [note, setNote] = useState('');

  const onCreate = async () => {
    if (!employeeId) {
      toast.error('Employee is required');
      return;
    }
    try {
      await ackPolicy({
        employeeId,
        policyCode: policyCode.trim(),
        policyVersion: policyVersion.trim(),
        status: Number(status),
        note: note.trim() || null,
      }).unwrap();
      toast.success('Policy acknowledgment saved');
      navigate('/fleet-transport/compliance/ops');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save acknowledgment');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Policy Acknowledgment</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/ops">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Employee" />
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
              value={policyCode}
              onChange={(event) => setPolicyCode(event.target.value)}
              placeholder="Policy code"
            />
            <Input
              value={policyVersion}
              onChange={(event) => setPolicyVersion(event.target.value)}
              placeholder="Version"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Acknowledged</SelectItem>
                <SelectItem value="1">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note"
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Save acknowledgment
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/compliance/ops')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
