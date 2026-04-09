import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType, PaymentMethod, PaymentResponsibility } from '@/db/schemas/enums';
import { useCreateBookingWithParcelsMutation } from '../../api/parcel.api';
import type { ParcelBookingFormValues, ReceiptSummary } from './parcel-form.types';
import {
  createEmptyParcel,
  createInitialFormValues,
  isApiRejectionError,
  parseAmount,
} from './parcel-create-form.utils';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';

export function useParcelCreateFormWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? '';
  const userBranchType = user?.branch?.type ?? null;
  const userId = user?.id ?? '';

  const [latestReceipt, setLatestReceipt] = useState<ReceiptSummary | null>(null);
  const [openParcels, setOpenParcels] = useState<Record<string, boolean>>({});

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
    params: {
      customerId: string;
      fullname: string;
      telephone: string;
      telephone2?: string;
      label: string;
    },
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

    const secondaryPhone = sanitizeString(params.telephone2).trim();
    const created = await createCustomer({
      fullname: name,
      telephone: phone,
      telephone2: secondaryPhone || null,
    }).unwrap();
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

    if (values.parcels.some((parcel) => parcel.destinationBranchId === userBranchId)) {
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
            telephone2: values.sender.telephone2,
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
                telephone2: parcel.receiver.telephone2,
                label: `Recipient for parcel ${index + 1}`,
              },
              customerCache,
            ),
          ),
        ),
      ]);

      const amounts = values.parcels.map((parcel, index) => ({
        charge: parseAmount(parcel.charge, `charge for parcel ${index + 1}`),
        value: parseAmount(parcel.parcelValue, `parcel value for parcel ${index + 1}`),
        partial: parseAmount(
          parcel.senderPartialPayment,
          `sender partial payment for parcel ${index + 1}`,
        ),
      }));

      for (let index = 0; index < values.parcels.length; index += 1) {
        const parcel = values.parcels[index];
        if (!parcel) continue;
        const charge = amounts[index]?.charge ?? 0;
        const partial = amounts[index]?.partial ?? 0;

        if (parcel.paymentResponsibility === 'SPLIT') {
          if (partial <= 0) {
            toast.error(`Sender partial payment is required for parcel ${index + 1}`);
            return;
          }
          if (partial >= charge) {
            toast.error(
              `Sender partial payment must be less than total charge for parcel ${index + 1}`,
            );
            return;
          }
        }
      }

      const status = sanitizeNumber(values.status);
      const response = await createBookingWithParcels({
        senderId: resolvedSenderId,
        status,
        parcels: values.parcels.map((parcel, index) => {
          const receiverId = receiverIds[index];
          if (!receiverId) throw new Error(`Recipient for parcel ${index + 1} is required`);
          return {
            destinationId: parcel.destinationBranchId,
            pickupLocationId: parcel.destinationLocationId || null,
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
            senderPaymentCedis: 0,
            plannedToBePaidCedis:
              parcel.paymentResponsibility === 'RECEIVER'
                ? amounts[index]?.charge
                : parcel.paymentResponsibility === 'SPLIT'
                  ? Math.max((amounts[index]?.charge ?? 0) - (amounts[index]?.partial ?? 0), 0)
                  : 0,
            paymentResponsibility:
              parcel.paymentResponsibility === 'SENDER'
                ? PaymentResponsibility.SENDER
                : parcel.paymentResponsibility === 'RECEIVER'
                  ? PaymentResponsibility.RECIPIENT
                  : PaymentResponsibility.SPLIT,
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
              : values.parcels[index]?.paymentResponsibility === 'SPLIT'
                ? (amounts[index]?.partial ?? 0)
                : 0,
          receiverToPayCedis:
            values.parcels[index]?.paymentResponsibility === 'RECEIVER'
              ? (amounts[index]?.charge ?? 0)
              : values.parcels[index]?.paymentResponsibility === 'SPLIT'
                ? Math.max((amounts[index]?.charge ?? 0) - (amounts[index]?.partial ?? 0), 0)
                : 0,
          issuedAt: new Date().toISOString(),
        })),
      });

      form.reset(createInitialFormValues());
      toast.success('Parcel transaction created successfully');
    } catch (error) {
      if (isApiRejectionError(error)) return;
      toast.error(error instanceof Error ? error.message : 'Failed to create parcel transaction');
    }
  };

  const handleCancel = () => {
    form.reset(createInitialFormValues());
    setLatestReceipt(null);
  };

  return {
    form,
    fields,
    append,
    remove,
    openParcels,
    setOpenParcels,
    latestReceipt,
    destinationBranchOptions,
    userBranchType,
    companyId,
    isSaving,
    submitDisabled,
    onSubmit,
    handleCancel,
    createEmptyParcel,
  };
}
