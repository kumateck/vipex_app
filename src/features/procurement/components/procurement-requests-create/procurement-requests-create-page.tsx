import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
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
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreatePurchaseRequestMutation,
  useListProcurementSupplierOptionsQuery,
} from '../../api/procurement.api';

export function ProcurementRequestsCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [supplierId, setSupplierId] = useState('__none__');
  const [amountPsw, setAmountPsw] = useState('');
  const [description, setDescription] = useState('');
  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();
  const [createRequest, { isLoading }] = useCreatePurchaseRequestMutation();

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    const parsedAmount = Number(amountPsw);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error('Amount must be a valid number');
      return;
    }

    try {
      await createRequest({
        title: title.trim(),
        supplierId: supplierId === '__none__' ? null : supplierId,
        amountPsw: parsedAmount,
        description: description.trim() || null,
      }).unwrap();
      toast.success('Purchase request created');
      navigate('/procurement/purchase-requests');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create purchase request');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Purchase Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Supplier</FieldLabel>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Amount (PSW)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={amountPsw}
                  onChange={(e) => setAmountPsw(e.target.value)}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save request
              </Button>
              <Button variant="outline" onClick={() => navigate('/procurement/purchase-requests')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
