import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetFleetComplianceEscalationPolicyQuery,
  useUpdateFleetComplianceEscalationPolicyMutation,
} from '../../api/fleet-transport.api';

export function FleetComplianceEscalationPolicyPage() {
  const { data, isLoading, refetch } = useGetFleetComplianceEscalationPolicyQuery();
  const [updatePolicy, { isLoading: updating }] =
    useUpdateFleetComplianceEscalationPolicyMutation();

  const [incidentEscalateAfterDays, setIncidentEscalateAfterDays] = useState('3');
  const [incidentCriticalEscalateAfterDays, setIncidentCriticalEscalateAfterDays] = useState('1');
  const [complianceEscalateAfterDays, setComplianceEscalateAfterDays] = useState('0');
  const [policyReackAfterDays, setPolicyReackAfterDays] = useState('365');
  const [incidentLimit, setIncidentLimit] = useState('400');
  const [recipientLimit, setRecipientLimit] = useState('20');

  useEffect(() => {
    if (!data) return;
    setIncidentEscalateAfterDays(String(data.incidentEscalateAfterDays));
    setIncidentCriticalEscalateAfterDays(String(data.incidentCriticalEscalateAfterDays));
    setComplianceEscalateAfterDays(String(data.complianceEscalateAfterDays));
    setPolicyReackAfterDays(String(data.policyReackAfterDays));
    setIncidentLimit(String(data.incidentLimit));
    setRecipientLimit(String(data.recipientLimit));
  }, [data]);

  const onSave = async () => {
    try {
      await updatePolicy({
        incidentEscalateAfterDays: Number(incidentEscalateAfterDays),
        incidentCriticalEscalateAfterDays: Number(incidentCriticalEscalateAfterDays),
        complianceEscalateAfterDays: Number(complianceEscalateAfterDays),
        policyReackAfterDays: Number(policyReackAfterDays),
        incidentLimit: Number(incidentLimit),
        recipientLimit: Number(recipientLimit),
      }).unwrap();
      toast.success('Compliance escalation policy updated');
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update policy');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Escalation Policy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground md:col-span-2">Loading policy...</p>
            ) : null}
            <Input
              type="number"
              min={1}
              max={90}
              value={incidentEscalateAfterDays}
              onChange={(event) => setIncidentEscalateAfterDays(event.target.value)}
              placeholder="Incident escalation days"
            />
            <Input
              type="number"
              min={1}
              max={30}
              value={incidentCriticalEscalateAfterDays}
              onChange={(event) => setIncidentCriticalEscalateAfterDays(event.target.value)}
              placeholder="Critical incident escalation days"
            />
            <Input
              type="number"
              min={0}
              max={90}
              value={complianceEscalateAfterDays}
              onChange={(event) => setComplianceEscalateAfterDays(event.target.value)}
              placeholder="Compliance escalation days"
            />
            <Input
              type="number"
              min={1}
              max={3650}
              value={policyReackAfterDays}
              onChange={(event) => setPolicyReackAfterDays(event.target.value)}
              placeholder="Policy re-ack days"
            />
            <Input
              type="number"
              min={1}
              max={1000}
              value={incidentLimit}
              onChange={(event) => setIncidentLimit(event.target.value)}
              placeholder="Incident scan limit"
            />
            <Input
              type="number"
              min={1}
              max={100}
              value={recipientLimit}
              onChange={(event) => setRecipientLimit(event.target.value)}
              placeholder="Recipient limit"
            />
            <div className="md:col-span-2">
              <Button onClick={onSave} disabled={updating}>
                Save Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
