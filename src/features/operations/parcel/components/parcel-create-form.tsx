import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useListStatusOptionsQuery } from '@/features/statuses/api/statuses.api';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateBookingWithParcelsMutation } from '../api/parcel.api';
import { CustomerPhoneLookupField } from './customer-phone-lookup-field';
import { ParcelReceiptActions } from './parcel-receipt-actions';

type PaymentResponsibility = 'SENDER' | 'RECEIVER';

export function ParcelCreateForm() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? '';
  const userId = user?.id ?? '';

  const [senderPhone, setSenderPhone] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senderFullname, setSenderFullname] = useState('');

  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [receiverFullname, setReceiverFullname] = useState('');

  const [destinationId, setDestinationId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [parcelDetails, setParcelDetails] = useState('');
  const [parcelContent, setParcelContent] = useState('');
  const [amountCedis, setAmountCedis] = useState('0');
  const [paymentResponsibility, setPaymentResponsibility] = useState<PaymentResponsibility>('SENDER');
  const [latestReceipt, setLatestReceipt] = useState<{
    bookingId: string;
    trackingCode: string;
    paymentResponsibility: PaymentResponsibility;
    amountCedis: number;
  } | null>(null);

  const { data: activeSession } = useGetCurrentActiveSessionQuery();

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: statusOptions = [] } = useListStatusOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [createBookingWithParcels, { isLoading: isSubmitting }] = useCreateBookingWithParcelsMutation();

  const sourceBranchName = useMemo(
    () => branchOptions.find((branch) => branch.id === userBranchId)?.name ?? 'Current branch',
    [branchOptions, userBranchId],
  );

  const submitDisabled = !companyId || !userId || !activeSession || isSubmitting || isCreatingCustomer;

  const resolveCustomerId = async (params: {
    customerId: string;
    fullname: string;
    telephone: string;
  }): Promise<string> => {
    if (params.customerId) return params.customerId;

    const name = params.fullname.trim();
    const phone = params.telephone.trim();
    if (!name || !phone) {
      throw new Error('Please provide telephone and fullname for customers not in records');
    }

    const created = await createCustomer({ fullname: name, telephone: phone }).unwrap();
    return created.id;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId || !userId || !userBranchId) {
      toast.error('Authenticated user context is incomplete');
      return;
    }
    if (!activeSession) {
      toast.error('An active cashier session is required');
      return;
    }
    if (!destinationId || !statusId) {
      toast.error('Destination and status are required');
      return;
    }

    const numericAmount = Number(amountCedis);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      const resolvedSenderId = await resolveCustomerId({
        customerId: senderId,
        fullname: senderFullname,
        telephone: senderPhone,
      });
      const resolvedReceiverId = await resolveCustomerId({
        customerId: receiverId,
        fullname: receiverFullname,
        telephone: receiverPhone,
      });

      const response = await createBookingWithParcels({
        senderId: resolvedSenderId,
        statusId,
        cashierSessionId: activeSession.id,
        parcels: [
          {
            destinationId,
            receiverId: resolvedReceiverId,
            statusId,
            parcelDetails,
            parcelContent,
            method: 0,
            senderPaymentCedis: paymentResponsibility === 'SENDER' ? numericAmount : 0,
            plannedToBePaidCedis: paymentResponsibility === 'RECEIVER' ? numericAmount : 0,
          },
        ],
      }).unwrap();

      const firstParcel = response.parcels[0];
      setLatestReceipt({
        bookingId: response.bookingId,
        trackingCode: firstParcel?.trackingCode ?? '-',
        paymentResponsibility,
        amountCedis: numericAmount,
      });
      toast.success('Parcel transaction created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create parcel transaction');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Parcel Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <CustomerPhoneLookupField
              label="Sender"
              phone={senderPhone}
              selectedCustomerId={senderId}
              fallbackName={senderFullname}
              onPhoneChange={setSenderPhone}
              onSelectedCustomerIdChange={setSenderId}
              onFallbackNameChange={setSenderFullname}
            />
            <CustomerPhoneLookupField
              label="Receiver"
              phone={receiverPhone}
              selectedCustomerId={receiverId}
              fallbackName={receiverFullname}
              onPhoneChange={setReceiverPhone}
              onSelectedCustomerIdChange={setReceiverId}
              onFallbackNameChange={setReceiverFullname}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Source Branch</Label>
              <Input value={sourceBranchName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Destination Branch</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Parcel Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Charge (GHS)</Label>
              <Input value={amountCedis} onChange={(event) => setAmountCedis(event.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Parcel Details</Label>
              <Textarea value={parcelDetails} onChange={(event) => setParcelDetails(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parcel Content</Label>
              <Textarea value={parcelContent} onChange={(event) => setParcelContent(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Responsibility</Label>
            <Select
              value={paymentResponsibility}
              onValueChange={(value) => setPaymentResponsibility(value as PaymentResponsibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SENDER">Sender pays now</SelectItem>
                <SelectItem value="RECEIVER">Receiver pays on pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Payment creation is blocked when no active session exists.
            </p>
            <Button type="submit" disabled={submitDisabled}>
              {isSubmitting || isCreatingCustomer ? 'Saving...' : 'Create Transaction'}
            </Button>
          </div>

          {latestReceipt ? (
            <ParcelReceiptActions
              bookingId={latestReceipt.bookingId}
              trackingCode={latestReceipt.trackingCode}
              paymentResponsibility={latestReceipt.paymentResponsibility}
              amountCedis={latestReceipt.amountCedis}
            />
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
