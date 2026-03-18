import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateBookingWithParcelsMutation } from '../api/parcel.api';
import { CustomerLookupSection } from './parcel-create/customer-lookup-section';
import { ParcelCard } from './parcel-create/parcel-card';
import { ParcelReceipts } from './parcel-create/parcel-receipts';
import { PARCEL_STATUS_OPTIONS } from './parcel-create/parcel-status-options';
import type {
  ParcelBookingFormValues,
  ParcelFormValues,
  ReceiptSummary,
} from './parcel-create/parcel-form.types';
import { Plus } from 'lucide-react';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

const createEmptyParcel = (): ParcelFormValues => ({
  destinationBranchId: '',
  destinationLocationId: '',
  parcelDetails: '',
  parcelContent: '',
  parcelValue: '',
  charge: '',
  paymentResponsibility: 'SENDER',
  receiver: {
    telephone: '',
    customerId: '',
    fullname: '',
  },
});

const parseAmount = (value: string, label: string) => {
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error(`Enter a valid ${label} amount`);
  }
  return amount;
};

export function ParcelCreateForm() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? '';
  const userId = user?.id ?? '';

  const [latestReceipt, setLatestReceipt] = useState<ReceiptSummary | null>(null);

  const { data: activeSession } = useGetCurrentActiveSessionQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [createBookingWithParcels, { isLoading: isSubmitting }] =
    useCreateBookingWithParcelsMutation();

  const form = useForm<ParcelBookingFormValues>({
    defaultValues: {
      sender: {
        telephone: '',
        customerId: '',
        fullname: '',
      },
      status: PARCEL_STATUS_OPTIONS[0]?.value ?? 0,
      parcels: [createEmptyParcel()],
    },
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parcels',
  });

  const sourceBranchName =
    branchOptions.find((branch) => branch.id === userBranchId)?.name ?? 'Current branch';

  const submitDisabled =
    !companyId ||
    !userId ||
    !activeSession ||
    isSubmitting ||
    isCreatingCustomer ||
    form.formState.isSubmitting;
  const isSaving = isSubmitting || isCreatingCustomer || form.formState.isSubmitting;

  const resolveCustomerId = async (
    params: { customerId: string; fullname: string; telephone: string; label: string },
    cache: Map<string, string>,
  ) => {
    if (params.customerId) return params.customerId;
    const phone = params.telephone.trim();
    const name = params.fullname.trim();

    if (!phone || !name) {
      throw new Error(`${params.label} telephone and fullname are required`);
    }

    const cachedId = cache.get(phone);
    if (cachedId) return cachedId;

    const created = await createCustomer({ fullname: name, telephone: phone }).unwrap();
    cache.set(phone, created.id);
    return created.id;
  };

  const onSubmit = async (values: ParcelBookingFormValues) => {
    if (!companyId || !userId || !userBranchId) {
      toast.error('Authenticated user context is incomplete');
      return;
    }

    if (!activeSession) {
      toast.error('An active cashier session is required');
      return;
    }

    if (values.status == null) {
      toast.error('Please select a parcel status');
      return;
    }

    try {
      const customerCache = new Map<string, string>();
      const [resolvedSenderId, receiverIds] = await Promise.all([
        resolveCustomerId(
          {
            customerId: values.sender.customerId,
            fullname: values.sender.fullname,
            telephone: values.sender.telephone,
            label: 'Sender',
          },
          customerCache,
        ),
        Promise.all(
          values.parcels.map((parcel, index) =>
            resolveCustomerId(
              {
                customerId: parcel.receiver.customerId,
                fullname: parcel.receiver.fullname,
                telephone: parcel.receiver.telephone,
                label: `Recipient for parcel ${index + 1}`,
              },
              customerCache,
            ),
          ),
        ),
      ]);

      const amounts =
        values.parcels.map((parcel, index) => ({
          charge: parseAmount(parcel.charge, `charge for parcel ${index + 1}`),
          value: parseAmount(parcel.parcelValue, `parcel value for parcel ${index + 1}`),
        })) || [];

      const response = await createBookingWithParcels({
        senderId: resolvedSenderId,
        status: values.status,
        cashierSessionId: activeSession.id,
        parcels: values.parcels.map((parcel, index) => ({
          destinationId: parcel.destinationBranchId,
          receiverId: receiverIds[index],
          status: values.status,
          parcelDetails: parcel.parcelDetails,
          parcelContent: parcel.parcelContent,
          method: 0,
          parcelValueCedis: amounts[index]?.value,
          chargeCedis: amounts[index]?.charge,
          senderPaymentCedis:
            parcel.paymentResponsibility === 'SENDER' ? amounts[index]?.charge : 0,
          plannedToBePaidCedis:
            parcel.paymentResponsibility === 'RECEIVER' ? amounts[index]?.charge : 0,
        })),
      }).unwrap();

      setLatestReceipt({
        bookingId: response.bookingId,
        parcels: response.parcels.map((parcel, index) => ({
          trackingCode: parcel.trackingCode ?? '-',
          paymentResponsibility: values.parcels[index]?.paymentResponsibility ?? 'SENDER',
          amountCedis: amounts[index]?.charge ?? 0,
        })),
      });

      toast.success('Parcel transaction created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create parcel transaction');
    }
  };

  const handleCancel = () => {
    form.reset();
    setLatestReceipt(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Create Parcel Booking</h2>
              <p className="text-sm text-muted-foreground">
                Confirm the source branch and default parcel status for this booking.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled} className="gap-2">
                {isSaving ? <Spinner /> : null}
                {isSaving ? 'Saving...' : 'Save Booking'}
              </Button>
            </div>
          </div>
          <ScrollableWrapper>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sender</CardTitle>
                  <CardDescription>
                    Search by phone to reuse existing customer records.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CustomerLookupSection
                      label="Sender"
                      phoneName="sender.telephone"
                      customerIdName="sender.customerId"
                      fullnameName="sender.fullname"
                      helperText="Lookup starts after 3 seconds when 10+ digits are entered."
                      layout="split"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Parcels</CardTitle>
                <CardDescription>
                  Each parcel can have its own recipient, destination branch, and pickup location.
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(createEmptyParcel())}
                  >
                    <Plus className="h-4 w-4" />
                    Add Parcel
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="max-h-[520px] pr-2">
                  <div className="space-y-4 pr-2">
                    {fields.map((field, index) => (
                      <ParcelCard
                        key={field.id}
                        index={index}
                        canRemove={fields.length > 1}
                        onRemove={() => remove(index)}
                        companyId={companyId}
                        branchOptions={branchOptions}
                      />
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  All parcels will be saved under a single booking. Ensure a cashier session is
                  active before saving.
                </p>
              </CardContent>
            </Card>
          </ScrollableWrapper>
        </form>
      </Form>

      <ParcelReceipts receipt={latestReceipt} />
    </div>
  );
}
