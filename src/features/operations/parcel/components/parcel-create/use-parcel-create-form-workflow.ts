import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType, PaymentMethod, PaymentResponsibility, UserType } from '@/db/schemas/enums';
import { useCreateBookingWithParcelsMutation } from '../../api/parcel.api';
import type { ParcelBookingFormValues, ReceiptSummary } from './parcel-form.types';
import { buildParcelCreateReceipt } from './build-parcel-create-receipt';
import {
  createEmptyParcel,
  createInitialFormValues,
  isApiRejectionError,
  parseAmount,
} from './parcel-create-form.utils';
import { useParcelCreateCustomerResolver } from './use-parcel-create-customer-resolver';
import { useParcelCreatePrintPreference } from './use-parcel-create-print-preference';
import { useParcelCreateSenderPayment } from './use-parcel-create-sender-payment';
import { sanitizeNumber } from '@/lib/utils';

export function useParcelCreateFormWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? '';
  const userBranchType = user?.branch?.type ?? null;
  const userId = user?.id ?? '';
  const isCashierUser =
    user?.userType === UserType.CASHIER ||
    (user?.cashierType !== null && user?.cashierType !== undefined);

  const [latestReceipt, setLatestReceipt] = useState<ReceiptSummary | null>(null);
  const [shouldPrintOnSubmit, setShouldPrintOnSubmit] = useState(false);
  const [openParcels, setOpenParcels] = useState<Record<string, boolean>>({});

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const destinationBranchOptions = branchOptions.filter(
    (branch) => branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE,
  );

  const { isCreatingCustomer, resolveCustomerId } = useParcelCreateCustomerResolver();
  const [createBookingWithParcels, { isLoading: isSubmitting }] =
    useCreateBookingWithParcelsMutation();

  const form = useForm<ParcelBookingFormValues>({
    defaultValues: createInitialFormValues(),
    mode: 'onSubmit',
  });

  const senderPayment = useParcelCreateSenderPayment({
    onPaidReceiptsReady: (receipt) => {
      setLatestReceipt(receipt);
      setShouldPrintOnSubmit(true);
    },
  });

  const printPreference = useParcelCreatePrintPreference({
    form,
    shouldPrintOnSubmit,
    setShouldPrintOnSubmit,
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

  const resetCreateForm = ({
    closePaymentDialog = true,
  }: { closePaymentDialog?: boolean } = {}) => {
    form.reset(createInitialFormValues());
    setOpenParcels({});
    setLatestReceipt(null);
    setShouldPrintOnSubmit(false);
    if (closePaymentDialog) {
      senderPayment.closePaymentDialog();
    }
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
            callSender: parcel.callSender,
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

      const receipt = buildParcelCreateReceipt({
        response,
        values,
        amounts,
        branchOptions,
      });
      // A cashier who can collect sender payments is always offered the chance to
      // complete payment now, regardless of whether they also want to print a receipt.
      // Parcels with nothing owed by the sender never reach this dialog — the backend
      // already creates those directly as PROCESSED, with no further step needed.
      const openedPaymentDialog = printPreference.canPrintAfterSubmit
        ? await senderPayment.openPaymentDialog(receipt)
        : false;
      const autoPrintReceipt = shouldPrintOnSubmit && printPreference.canPrintAfterSubmit;
      resetCreateForm({ closePaymentDialog: !openedPaymentDialog });
      if (!openedPaymentDialog) {
        setLatestReceipt(receipt);
        setShouldPrintOnSubmit(autoPrintReceipt);
      }
      toast.success(
        isCashierUser
          ? 'Parcel transaction created successfully'
          : 'Booking saved and sent to Sender Cashier Payments',
      );
    } catch (error) {
      if (isApiRejectionError(error)) return;
      toast.error(error instanceof Error ? error.message : 'Failed to create parcel transaction');
    }
  };

  const handleCancel = () => {
    resetCreateForm();
  };

  return {
    form,
    fields,
    append,
    remove,
    openParcels,
    setOpenParcels,
    latestReceipt,
    shouldPrintOnSubmit,
    setShouldPrintOnSubmit,
    canPrintAfterSubmit: printPreference.canPrintAfterSubmit,
    senderPayment,
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
