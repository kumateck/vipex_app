import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProcurementSupplierMutation } from '../../api/procurement.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function ProcurementSuppliersCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [createSupplier, { isLoading }] = useCreateProcurementSupplierMutation();

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      await createSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim() || null,
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        address: address.trim() || null,
      }).unwrap();
      toast.success('Supplier created');
      navigate('/procurement/suppliers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create supplier');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Supplier name</FieldLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Contact person</FieldLabel>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Telephone</FieldLabel>
                <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Address</FieldLabel>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save supplier
              </Button>
              <Button variant="outline" onClick={() => navigate('/procurement/suppliers')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
