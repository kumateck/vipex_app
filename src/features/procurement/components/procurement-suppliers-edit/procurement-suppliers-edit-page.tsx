import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  PHONE_DIGITS,
  isOptionalTenDigitPhone,
  limitPhoneDigits,
  normalizePhoneDigits,
  phoneLengthMessage,
} from '@/lib/phone';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetProcurementSupplierByIdQuery,
  useUpdateProcurementSupplierMutation,
} from '../../api/procurement.api';

export function ProcurementSuppliersEditPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const { data: supplier, isLoading } = useGetProcurementSupplierByIdQuery(id, {
    skip: !id,
  });
  const [updateSupplier, { isLoading: saving }] = useUpdateProcurementSupplierMutation();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!supplier) return;
    setName(supplier.name);
    setContactPerson(supplier.contactPerson ?? '');
    setEmail(supplier.email ?? '');
    setTelephone(supplier.telephone ?? '');
    setAddress(supplier.address ?? '');
  }, [supplier]);

  const onSubmit = async () => {
    if (!id) return;
    if (!name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    if (!isOptionalTenDigitPhone(telephone)) {
      toast.error(phoneLengthMessage());
      return;
    }

    try {
      await updateSupplier({
        id,
        body: {
          name: name.trim(),
          contactPerson: contactPerson.trim() || null,
          email: email.trim() || null,
          telephone: normalizePhoneDigits(telephone) || null,
          address: address.trim() || null,
        },
      }).unwrap();
      toast.success('Supplier updated');
      navigate('/procurement/suppliers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Edit Supplier</CardTitle>
            <Button asChild variant="outline">
              <Link to="/procurement/suppliers">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading supplier...</p>
            ) : null}
            {!isLoading && !supplier ? (
              <p className="text-sm text-muted-foreground">Supplier not found.</p>
            ) : null}

            {supplier ? (
              <>
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Supplier name</FieldLabel>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Contact person</FieldLabel>
                    <Input
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Telephone</FieldLabel>
                    <Input
                      value={telephone}
                      onChange={(e) => setTelephone(limitPhoneDigits(e.target.value))}
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={PHONE_DIGITS}
                      placeholder="0240000000"
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>Address</FieldLabel>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                    />
                  </Field>
                </FieldGroup>
                <div className="flex gap-2">
                  <Button onClick={onSubmit} disabled={saving}>
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/procurement/suppliers')}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
