import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateBankSettlementMutation,
  useListReconciliationBranchOptionsQuery,
} from '../../api/reconciliation.api';

export function ReconciliationBankSettlementsCreatePage() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState('__none__');
  const [settlementDate, setSettlementDate] = useState<Date | undefined>(undefined);
  const [settlementNo, setSettlementNo] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [expectedAmountPsw, setExpectedAmountPsw] = useState('');
  const [bankedAmountPsw, setBankedAmountPsw] = useState('');
  const [notes, setNotes] = useState('');
  const { data: branches = [] } = useListReconciliationBranchOptionsQuery();
  const [createSettlement, { isLoading }] = useCreateBankSettlementMutation();

  const onSubmit = async () => {
    if (branchId === '__none__') {
      toast.error('Select a branch');
      return;
    }
    if (!settlementDate) {
      toast.error('Select settlement date');
      return;
    }

    const expected = Number(expectedAmountPsw);
    const banked = Number(bankedAmountPsw);
    if (!Number.isFinite(expected) || expected < 0 || !Number.isFinite(banked) || banked < 0) {
      toast.error('Expected and banked amounts must be valid non-negative PSW values');
      return;
    }

    try {
      await createSettlement({
        branchId,
        settlementDate: settlementDate.toISOString(),
        settlementNo: settlementNo.trim() || null,
        bankReference: bankReference.trim() || null,
        expectedAmountPsw: expected,
        bankedAmountPsw: banked,
        notes: notes.trim() || null,
      }).unwrap();
      toast.success('Bank settlement created');
      navigate('/reconciliation/bank-settlements');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create bank settlement');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Bank Settlement</CardTitle>
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
                <FieldLabel>Settlement date</FieldLabel>
                <DateTimePicker
                  value={settlementDate}
                  onChange={setSettlementDate}
                  placeholder="Select settlement date and time"
                />
              </Field>
              <Field>
                <FieldLabel>Settlement number (optional)</FieldLabel>
                <Input
                  value={settlementNo}
                  onChange={(event) => setSettlementNo(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Bank reference</FieldLabel>
                <Input
                  value={bankReference}
                  onChange={(event) => setBankReference(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Expected amount (PSW)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={expectedAmountPsw}
                  onChange={(event) => setExpectedAmountPsw(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Banked amount (PSW)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={bankedAmountPsw}
                  onChange={(event) => setBankedAmountPsw(event.target.value)}
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
                Save settlement
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/reconciliation/bank-settlements')}
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
