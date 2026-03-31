import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateReconciliationSessionMutation,
  useListReconciliationBranchOptionsQuery,
} from '../api/reconciliation.api';

export function ReconciliationSessionsCreatePage() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState('__none__');
  const [confirmationDate, setConfirmationDate] = useState('');
  const [expectedCashCedis, setExpectedCashCedis] = useState('');
  const [countedCashCedis, setCountedCashCedis] = useState('');
  const [notes, setNotes] = useState('');
  const { data: branches = [] } = useListReconciliationBranchOptionsQuery();
  const [createSession, { isLoading }] = useCreateReconciliationSessionMutation();

  const onSubmit = async () => {
    if (branchId === '__none__') {
      toast.error('Select a branch');
      return;
    }
    if (!confirmationDate) {
      toast.error('Select confirmation date and time');
      return;
    }
    const expected = Number(expectedCashCedis);
    const counted = Number(countedCashCedis);
    if (!Number.isFinite(expected) || expected < 0 || !Number.isFinite(counted) || counted < 0) {
      toast.error('Expected and counted cash must be valid non-negative numbers');
      return;
    }

    try {
      await createSession({
        branchId,
        confirmationDate: new Date(confirmationDate).toISOString(),
        expectedCashCedis: expected,
        countedCashCedis: counted,
        notes: notes.trim() || null,
      }).unwrap();
      toast.success('Reconciliation session created');
      navigate('/reconciliation/sessions');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create reconciliation session',
      );
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Reconciliation Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Branch</FieldLabel>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select branch</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Confirmation date</FieldLabel>
                <Input
                  type="datetime-local"
                  value={confirmationDate}
                  onChange={(event) => setConfirmationDate(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Expected cash (Cedis)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={expectedCashCedis}
                  onChange={(event) => setExpectedCashCedis(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Counted cash (Cedis)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={countedCashCedis}
                  onChange={(event) => setCountedCashCedis(event.target.value)}
                />
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save session
              </Button>
              <Button variant="outline" onClick={() => navigate('/reconciliation/sessions')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
