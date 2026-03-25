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
import { Spinner } from '@/components/ui/spinner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType, PaymentMethod } from '@/db/schemas/enums';
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
  senderSettlementMode: 'PAY_NOW',
  receiver: {
    telephone: '',
    customerId: '',
    fullname: '',
  },
});

const createInitialFormValues = (): ParcelBookingFormValues => ({
  sender: {
    telephone: '',
    customerId: '',
    fullname: '',
  },
  status: PARCEL_STATUS_OPTIONS[0]?.value ?? 0,
  parcels: [createEmptyParcel()],
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
  const userBranchType = user?.branch?.type ?? null;
  const userId = user?.id ?? '';

  const [latestReceipt, setLatestReceipt] = useState<ReceiptSummary | null>(null);

  const { data: activeSession } = useGetCurrentActiveSessionQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const destinationBranchOptions = branchOptions.filter(
    (branch) => branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE,
  );

  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [createBookingWithParcels, { isLoading: isSubmitting }] =
    useCreateBookingWithParcelsMutation();

  const form = useForm<ParcelBookingFormValues>({
    defaultValues: createInitialFormValues(),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parcels',
  });

  const submitDisabled =
    userBranchType === BranchType.HEADOFFICE ||
    !companyId ||
    !userId ||
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
    if (userBranchType === BranchType.HEADOFFICE) {
      toast.error('Head office users cannot create parcel bookings');
      return;
    }

    if (!companyId || !userId || !userBranchId) {
      toast.error('Authenticated user context is incomplete');
      return;
    }

    if (values.status == null) {
      toast.error('Please select a parcel status');
      return;
    }

    const hasSameDestinationAsSource = values.parcels.some(
      (parcel) => parcel.destinationBranchId === userBranchId,
    );
    if (hasSameDestinationAsSource) {
      toast.error('Destination branch cannot be your current branch');
      return;
    }

    const destinationBranchById = new Map(branchOptions.map((branch) => [branch.id, branch]));
    const hasHeadOfficeDestination = values.parcels.some((parcel) => {
      const destinationBranch = destinationBranchById.get(parcel.destinationBranchId);
      return destinationBranch?.type === BranchType.HEADOFFICE;
    });
    if (hasHeadOfficeDestination) {
      toast.error('Head office cannot be selected as destination branch');
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
      const requiresSessionForPayNow = values.parcels.some(
        (parcel) =>
          parcel.paymentResponsibility === 'SENDER' && parcel.senderSettlementMode === 'PAY_NOW',
      );
      if (requiresSessionForPayNow && !activeSession) {
        toast.error('An active cashier session is required when collecting sender payment now');
        return;
      }

      const status = Number(values.status);
      const response = await createBookingWithParcels({
        senderId: resolvedSenderId,
        status,
        cashierSessionId: activeSession?.id ?? null,
        parcels: values.parcels.map((parcel, index) => {
          const receiverId = receiverIds[index];
          if (!receiverId) {
            throw new Error(`Recipient for parcel ${index + 1} is required`);
          }
          return {
            destinationId: parcel.destinationBranchId,
            receiverId,
            status,
            parcelDetails: parcel.parcelDetails,
            parcelContent: parcel.parcelContent,
            method:
              parcel.paymentResponsibility === 'SENDER' && parcel.senderSettlementMode === 'CREDIT'
                ? PaymentMethod.CREDIT
                : PaymentMethod.CASH,
            parcelValueCedis: amounts[index]?.value,
            chargeCedis: amounts[index]?.charge,
            senderPaymentCedis:
              parcel.paymentResponsibility === 'SENDER' && parcel.senderSettlementMode === 'PAY_NOW'
                ? amounts[index]?.charge
                : 0,
            plannedToBePaidCedis:
              parcel.paymentResponsibility === 'RECEIVER' ? amounts[index]?.charge : 0,
          };
        }),
      }).unwrap();

      setLatestReceipt({
        bookingId: response.bookingId,
        parcels: response.parcels.map((parcel, index) => ({
          bookingCode: parcel.bookingCode ?? response.bookingId,
          trackingCode: parcel.trackingCode ?? '-',
          parcelDetails: values.parcels[index]?.parcelDetails ?? '-',
          senderName: values.sender.fullname,
          senderTelephone: values.sender.telephone,
          receiverName: values.parcels[index]?.receiver.fullname ?? '-',
          receiverTelephone: values.parcels[index]?.receiver.telephone ?? '-',
          destinationBranchName:
            branchOptions.find((branch) => branch.id === values.parcels[index]?.destinationBranchId)
              ?.name ?? '-',
          destinationLocationName: values.parcels[index]?.destinationLocationId ?? '-',
          totalChargeCedis: amounts[index]?.charge ?? 0,
          senderPaidCedis:
            values.parcels[index]?.paymentResponsibility === 'SENDER'
              ? (amounts[index]?.charge ?? 0)
              : 0,
          receiverToPayCedis:
            values.parcels[index]?.paymentResponsibility === 'RECEIVER'
              ? (amounts[index]?.charge ?? 0)
              : 0,
          issuedAt: new Date().toISOString(),
        })),
      });

      form.reset(createInitialFormValues());
      toast.success('Parcel transaction created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create parcel transaction');
    }
  };

  const handleCancel = () => {
    form.reset(createInitialFormValues());
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
            <div className="space-y-5">
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
                  <div className="space-y-4 pr-2">
                    {fields.map((field, index) => (
                      <ParcelCard
                        key={field.id}
                        index={index}
                        canRemove={fields.length > 1}
                        onRemove={() => remove(index)}
                        companyId={companyId}
                        branchOptions={destinationBranchOptions}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    All parcels will be saved under a single booking. Cashier session is only
                    required when collecting sender payment now.
                  </p>
                  {userBranchType === BranchType.HEADOFFICE ? (
                    <p className="text-xs text-destructive">
                      Parcel creation is disabled for head office branches.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </ScrollableWrapper>
        </form>
      </Form>

      <ParcelReceipts receipt={latestReceipt} />
    </div>
  );
}
